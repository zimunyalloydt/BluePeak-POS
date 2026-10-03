import {
  NativeModules,
  PermissionsAndroid,
  Platform,
} from "react-native";

/**
 * Temporary diagnostic:
 * This tells us exactly which Bluetooth native modules
 * are actually registered with React Native at runtime.
 */
console.log(
  "🔵 Native Bluetooth modules:",
  Object.keys(NativeModules).filter((key) =>
    key.toLowerCase().includes("bluetooth")
  )
);

export interface PrinterDevice {
  name: string;
  address: string;
  connected?: boolean;
}

interface PrinterResult {
  paired: PrinterDevice[];
  found: PrinterDevice[];
}

interface BluetoothManagerNative {
  isBluetoothEnabled(): Promise<boolean>;
  enableBluetooth(): Promise<boolean>;
  disableBluetooth(): Promise<boolean>;

  scanDevices(): Promise<PrinterResult | string>;

  connect(address: string): Promise<void>;
  disconnect(address: string): Promise<void>;
  unpaire(address: string): Promise<string>;

  isDeviceConnected(): Promise<boolean>;
  getConnectedDeviceAddress(): Promise<string | null>;
  getConnectedDevice(): Promise<PrinterDevice | null>;
}

interface BluetoothEscposPrinterNative {
  printerInit(): Promise<void>;

  printerAlign(align: number): Promise<void>;

  printText(
    text: string,
    options?: Record<string, any>
  ): Promise<void>;

  printPic(
    base64: string,
    options?: Record<string, any>
  ): Promise<void>;

  printQRCode(
    content: string,
    size: number,
    align?: number
  ): Promise<void>;

  printBarCode(
    content: string,
    symbology: number,
    width: number,
    height: number,
    align: number,
    textPosition: number
  ): Promise<void>;

  cutPaper(): Promise<void>;
}

/**
 * Native Bluetooth modules.
 *
 * These are registered from:
 * RNBluetoothEscposPrinterPackage
 */
const BluetoothManager =
  NativeModules.BluetoothManager as
    | BluetoothManagerNative
    | undefined;

const BluetoothEscposPrinter =
  NativeModules.BluetoothEscposPrinter as
    | BluetoothEscposPrinterNative
    | undefined;

const PRINTER_NAME = "printer001-a3d3";

/**
 * Verify that the native modules were successfully
 * registered with React Native.
 */
function validateNativeModules(): {
  manager: BluetoothManagerNative;
  printer: BluetoothEscposPrinterNative;
} {
  console.log(
    "🔵 Checking BluetoothManager:",
    !!NativeModules.BluetoothManager
  );

  console.log(
    "🔵 Checking BluetoothEscposPrinter:",
    !!NativeModules.BluetoothEscposPrinter
  );

  console.log(
    "🔵 Available Bluetooth modules:",
    Object.keys(NativeModules).filter((key) =>
      key.toLowerCase().includes("bluetooth")
    )
  );

  if (!BluetoothManager) {
    throw new Error(
      "BluetoothManager native module is not available. " +
        "The native Bluetooth package is not registered in the Android app."
    );
  }

  if (!BluetoothEscposPrinter) {
    throw new Error(
      "BluetoothEscposPrinter native module is not available. " +
        "The native ESC/POS package is not registered in the Android app."
    );
  }

  return {
    manager: BluetoothManager,
    printer: BluetoothEscposPrinter,
  };
}

/**
 * Request Android Bluetooth permissions.
 */
async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS !== "android") {
    return true;
  }

  try {
    /**
     * Android 12+
     */
    if (Platform.Version >= 31) {
      const result =
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);

      const scanGranted =
        result[
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
        ] === PermissionsAndroid.RESULTS.GRANTED;

      const connectGranted =
        result[
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
        ] === PermissionsAndroid.RESULTS.GRANTED;

      console.log(
        "🔐 Bluetooth SCAN permission:",
        scanGranted
      );

      console.log(
        "🔐 Bluetooth CONNECT permission:",
        connectGranted
      );

      return scanGranted && connectGranted;
    }

    /**
     * Android 11 and below
     */
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    const granted =
      result === PermissionsAndroid.RESULTS.GRANTED;

    console.log(
      "🔐 Location permission:",
      granted
    );

    return granted;
  } catch (error) {
    console.error(
      "❌ Bluetooth permission request failed:",
      error
    );

    return false;
  }
}

/**
 * The old native package can return scan results
 * either as an object or as a JSON string.
 */
function parseScanResult(
  result: PrinterResult | string
): PrinterResult {
  if (typeof result === "string") {
    try {
      return JSON.parse(result);
    } catch {
      return {
        paired: [],
        found: [],
      };
    }
  }

  return result;
}

/**
 * Format money for the receipt.
 */
function formatMoney(value: number): string {
  const amount = Number(value) || 0;

  return amount.toFixed(2);
}

/**
 * Format quantities without unnecessary decimals.
 */
function formatNumber(value: number): string {
  const number = Number(value) || 0;

  if (Number.isInteger(number)) {
    return String(number);
  }

  return number.toFixed(2);
}

/**
 * Format receipt date.
 */
function formatDate(value: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

/**
 * Keep product names within the width of
 * an 80mm thermal receipt.
 */
function truncate(
  value: string,
  maxLength: number
): string {
  if (!value) {
    return "";
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.substring(0, maxLength - 3)}...`;
}

export const printerService = {
  /**
   * Check whether Bluetooth is enabled.
   */
  async isBluetoothEnabled(): Promise<boolean> {
    const { manager } = validateNativeModules();

    const granted =
      await requestBluetoothPermissions();

    if (!granted) {
      throw new Error(
        "Bluetooth permission was denied. " +
          "Please allow Bluetooth access for BluePeak in Android settings."
      );
    }

    return manager.isBluetoothEnabled();
  },

  /**
   * Scan for Bluetooth printers/devices.
   */
  async scanDevices(): Promise<PrinterResult> {
    const { manager } = validateNativeModules();

    const granted =
      await requestBluetoothPermissions();

    if (!granted) {
      throw new Error(
        "Bluetooth permission was denied. " +
          "Please allow Bluetooth access for BluePeak in Android settings."
      );
    }

    console.log(
      "🔍 Scanning Bluetooth devices..."
    );

    const result = await manager.scanDevices();

    const parsed = parseScanResult(result);

    console.log(
      "🔍 Paired Bluetooth devices:",
      parsed.paired
    );

    console.log(
      "🔍 Found Bluetooth devices:",
      parsed.found
    );

    return parsed;
  },

  /**
   * Find the configured BluePeak receipt printer.
   */
  async findPrinter(): Promise<PrinterDevice | null> {
    const result = await this.scanDevices();

    const devices = [
      ...(result.paired || []),
      ...(result.found || []),
    ];

    console.log(
      "🖨️ Bluetooth devices:",
      devices
    );

    const printer = devices.find(
      (device) =>
        device.name?.toLowerCase() ===
        PRINTER_NAME.toLowerCase()
    );

    if (printer) {
      console.log(
        "✅ BluePeak printer found:",
        printer
      );
    } else {
      console.log(
        `❌ Printer "${PRINTER_NAME}" was not found.`
      );
    }

    return printer ?? null;
  },

  /**
   * Connect to the BluePeak receipt printer.
   */
  async connect(): Promise<PrinterDevice> {
    const { manager } = validateNativeModules();

    const granted =
      await requestBluetoothPermissions();

    if (!granted) {
      throw new Error(
        "Bluetooth permission was denied. " +
          "Please allow Bluetooth access for BluePeak in Android settings."
      );
    }

    const printer = await this.findPrinter();

    if (!printer) {
      throw new Error(
        `Printer "${PRINTER_NAME}" was not found. ` +
          "Make sure the printer is switched on and paired with the phone."
      );
    }

    console.log(
      `🔗 Connecting to ${printer.name} (${printer.address})...`
    );

    await manager.connect(printer.address);

    console.log(
      "✅ Printer connected."
    );

    return printer;
  },

  /**
   * Check whether a printer is currently connected.
   */
  async isConnected(): Promise<boolean> {
    const { manager } = validateNativeModules();

    const connected =
      await manager.isDeviceConnected();

    console.log(
      "🖨️ Printer connected:",
      connected
    );

    return connected;
  },

  /**
   * Get the currently connected printer.
   */
  async getConnectedPrinter(): Promise<PrinterDevice | null> {
    const { manager } = validateNativeModules();

    return manager.getConnectedDevice();
  },

  /**
   * Disconnect the currently connected printer.
   */
  async disconnect(): Promise<void> {
    const { manager } = validateNativeModules();

    const address =
      await manager.getConnectedDeviceAddress();

    if (address) {
      console.log(
        `🔌 Disconnecting printer ${address}...`
      );

      await manager.disconnect(address);

      console.log(
        "✅ Printer disconnected."
      );
    }
  },

  /**
   * Simple printer test.
   */
  async testPrint(): Promise<void> {
    const { printer } = validateNativeModules();

    console.log(
      "🖨️ Starting printer test..."
    );

    const connected =
      await this.isConnected();

    if (!connected) {
      await this.connect();
    }

    /**
     * Initialize printer before printing.
     */
    await printer.printerInit();

    /**
     * Center.
     */
    await printer.printerAlign(1);

    await printer.printText(
      "BLUEPEAK POS\n",
      {
        widthtimes: 2,
        heigthtimes: 2,
      }
    );

    await printer.printText(
      "PRINTER TEST\n\n",
      {}
    );

    await printer.printerAlign(0);

    await printer.printText(
      "--------------------------------\n",
      {}
    );

    await printer.printText(
      "Printer: RK-E260L\n",
      {}
    );

    await printer.printText(
      "Bluetooth: printer001-a3d3\n",
      {}
    );

    await printer.printText(
      "Status: Connected\n",
      {}
    );

    await printer.printText(
      "--------------------------------\n",
      {}
    );

    await printer.printerAlign(1);

    await printer.printText(
      "Bluetooth printing works!\n\n",
      {}
    );

    /**
     * Feed the paper sufficiently far beyond
     * the print head so the cutter can reach
     * the blank section.
     *
     * The RK-E260L cutter is approximately
     * 10–15mm below the print head.
     *
     * Use plain \n. Do not use \n\r.
     */
    await printer.printText(
      "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
      {}
    );

    /**
     * Allow the paper feed to physically finish
     * before firing the cutter.
     */
    await new Promise((resolve) =>
      setTimeout(resolve, 2000)
    );

    try {
      await printer.cutPaper();

      console.log(
        "✂️ Test paper cut successfully."
      );
    } catch (error) {
      console.log(
        "⚠️ Paper cutter not available:",
        error
      );
    }

    console.log(
      "✅ Printer test completed."
    );
  },

  /**
   * Print a complete Coldstone Trading POS receipt.
   *
   * Layout based on the provided 80mm receipt photo.
   */
  async printReceipt(receipt: {
    saleId: number;
    saleDate: string;
    cashier: string;
    paymentMethod: string;
    subtotal: number;
    vat: number;
    total: number;
    amountPaid: number;
    changeGiven: number;
    customerName?: string | null;

    items: {
      productName: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }[];
  }): Promise<void> {
    const { printer } = validateNativeModules();

    console.log(
      "🧾 Printing Coldstone receipt:",
      receipt.saleId
    );

    try {
      /**
       * Make sure printer is connected.
       */
      const connected =
        await this.isConnected();

      if (!connected) {
        console.log(
          "🔗 Printer is not connected. Connecting..."
        );

        await this.connect();
      }

      /**
       * Initialize printer before printing.
       */
      await printer.printerInit();

      /**
       * RK-E260L / 80mm receipt width.
       *
       * 48 characters is a safe normal-font width.
       */
      const WIDTH = 48;

      const line = "-".repeat(WIDTH);

      /**
       * Format receipt date:
       *
       * 4/13/2026 17:51
       */
      const formatReceiptDate = (
        value: string
      ): string => {
        if (!value) {
          return "";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
          return value;
        }

        const month =
          date.getMonth() + 1;

        const day =
          date.getDate();

        const year =
          date.getFullYear();

        const hours =
          String(
            date.getHours()
          ).padStart(2, "0");

        const minutes =
          String(
            date.getMinutes()
          ).padStart(2, "0");

        return `${month}/${day}/${year} ${hours}:${minutes}`;
      };

      /**
       * Right-align an amount against a label.
       */
      const amountLine = (
        label: string,
        value: number
      ): string => {
        const amount =
          formatMoney(value);

        const spaces =
          WIDTH -
          label.length -
          amount.length;

        return (
          label +
          " ".repeat(
            Math.max(1, spaces)
          ) +
          amount +
          "\n"
        );
      };

      /**
       * Create an item table header.
       *
       * Product       Price   Qty       Total
       */
      const itemHeader =
        "Product".padEnd(27) +
        "Price".padStart(7) +
        "Qty".padStart(5) +
        "Total".padStart(9) +
        "\n";

      /**
       * Create an item table row.
       */
      const itemRow = (
        productName: string,
        unitPrice: number,
        quantity: number,
        total: number
      ): string => {
        const name =
          truncate(
            productName,
            27
          ).padEnd(27);

        const price =
          formatMoney(
            unitPrice
          ).padStart(7);

        const qty =
          formatNumber(
            quantity
          ).padStart(5);

        const totalAmount =
          formatMoney(
            total
          ).padStart(9);

        return (
          name +
          price +
          qty +
          totalAmount +
          "\n"
        );
      };

      /* =====================================================
         HEADER
      ===================================================== */

      await printer.printerAlign(1);

      await printer.printText(
        "COLDSTONE TRADING\n",
        {
          widthtimes: 2,
          heigthtimes: 1,
        }
      );

      await printer.printText(
        "(PRIVATE) LIMITED\n",
        {
          widthtimes: 1,
          heigthtimes: 1,
        }
      );

      await printer.printText(
        "2 STIRLING ROAD\n",
        {}
      );

      await printer.printText(
        "HARARE\n",
        {}
      );

      await printer.printText(
        "\n",
        {}
      );

      /* =====================================================
         INVOICE / DATE
      ===================================================== */

      await printer.printerAlign(0);

      await printer.printText(
        `Invoice: ${receipt.saleId}\n`,
        {}
      );

      await printer.printText(
        `${formatReceiptDate(
          receipt.saleDate
        )}\n`,
        {}
      );

      await printer.printText(
        line + "\n",
        {}
      );

      /* =====================================================
         ITEMS HEADER
      ===================================================== */

      await printer.printText(
        itemHeader,
        {}
      );

      await printer.printText(
        line + "\n",
        {}
      );

      /* =====================================================
         ITEMS
      ===================================================== */

      for (const item of receipt.items) {
        await printer.printText(
          itemRow(
            item.productName,
            item.unitPrice,
            item.quantity,
            item.total
          ),
          {}
        );
      }

      /* =====================================================
         GROSS TOTAL
      ===================================================== */

      await printer.printText(
        line + "\n",
        {}
      );

      /**
       * Total quantity.
       */
      const totalQuantity =
        receipt.items.reduce(
          (sum, item) =>
            sum +
            Number(
              item.quantity || 0
            ),
          0
        );

      await printer.printText(
        "Gross Total:".padStart(35) +
          String(
            totalQuantity
          ).padStart(5) +
          " " +
          formatMoney(
            receipt.subtotal
          ).padStart(7) +
          "\n",
        {}
      );

      await printer.printText(
        line + "\n",
        {}
      );

      /* =====================================================
         TOTALS
      ===================================================== */

      await printer.printText(
        amountLine(
          "Net Total:",
          receipt.total
        ),
        {}
      );

      await printer.printText(
        amountLine(
          "USD paid:",
          receipt.amountPaid
        ),
        {}
      );

      /**
       * Positive change = customer paid more.
       * Negative value = amount still owing.
       */
      if (
        receipt.changeGiven >= 0
      ) {
        await printer.printText(
          amountLine(
            "Balance:",
            receipt.changeGiven
          ),
          {}
        );
      } else {
        await printer.printText(
          amountLine(
            "Balance Due:",
            Math.abs(
              receipt.changeGiven
            )
          ),
          {}
        );
      }

      /* =====================================================
         CASHIER
      ===================================================== */

      await printer.printText(
        line + "\n",
        {}
      );

      await printer.printText(
        `Sales Person: ${receipt.cashier}\n`,
        {}
      );

      /* =====================================================
         FOOTER
      ===================================================== */

      await printer.printText(
        line + "\n",
        {}
      );

      await printer.printerAlign(1);

      await printer.printText(
        "Thank you for shopping with us pamhata penyu mese\n",
        {}
      );

      await printer.printText(
        "Please come back soon\n",
        {}
      );

      /* =====================================================
         EXTRA BLANK SPACE / CUTTER FEED
      ===================================================== */

      /**
       * Feed enough paper after the footer so that
       * the final printed line moves beyond the cutter
       * position.
       *
       * The RK-E260L cutter sits approximately
       * 10–15mm below the print head.
       *
       * 15 line feeds provides a generous safety margin.
       *
       * IMPORTANT:
       * Use plain \n only.
       * Do not use \n\r with this library.
       */
      await printer.printText(
        "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
        {}
      );

      /**
       * Allow physical paper movement to finish
       * before firing the cutter.
       */
      await new Promise((resolve) =>
        setTimeout(resolve, 2000)
      );

      /**
       * Cut paper.
       *
       * The native package sends the printer's
       * ESC/POS cut command (GS V 1).
       */
      try {
        await printer.cutPaper();

        console.log(
          "✂️ Receipt paper cut successfully."
        );
      } catch (error) {
        console.log(
          "⚠️ Paper cutter not available:",
          error
        );
      }

      console.log(
        "✅ Coldstone receipt printed successfully."
      );
    } catch (error) {
      console.error(
        "❌ Receipt printing failed:",
        error
      );

      throw error;
    }
  },
};