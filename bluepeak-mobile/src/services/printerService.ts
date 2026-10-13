import {
  NativeModules,
  PermissionsAndroid,
  Platform,
} from "react-native";

/* ============================================================
   TYPES
============================================================ */

export interface PrinterDevice {
  name: string;
  address: string;
  connected?: boolean;
}

export interface PrinterResult {
  paired: PrinterDevice[];
  found: PrinterDevice[];
}

export interface EscPosTextOptions {
  widthtimes?: number;
  heigthtimes?: number; // NOTE: native module spelling
  cut?: boolean;
}

export interface ReceiptItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Receipt {
  saleId: number;
  saleDate: string;
  cashier: string;
  paymentMethod: string;
  subtotal: number;
  //vat: number;
  total: number;
  amountPaid: number;
  changeGiven: number;
  customerName?: string | null;
  items: ReceiptItem[];
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

  printText(text: string, options?: EscPosTextOptions): Promise<void>;

  printPic(base64: string, options?: Record<string, any>): Promise<void>;

  printQRCode(content: string, size: number, align?: number): Promise<void>;

  printBarCode(
    content: string,
    symbology: number,
    width: number,
    height: number,
    align: number,
    textPosition: number
  ): Promise<void>;

  cutPaper(): Promise<void>;
  cutOnePoint(): Promise<void>;
}

/* ============================================================
   CONFIG
============================================================ */

export const PRINTER_NAME = "printer001-a3d3";

/** 80mm receipt width in normal-font characters. */
const RECEIPT_WIDTH = 48;

const PERMISSION_DENIED_MESSAGE =
  "Bluetooth permission was denied. " +
  "Please allow Bluetooth access for BluePeak in Android settings.";

/* ============================================================
   NATIVE MODULE RESOLUTION
============================================================ */

const BluetoothManager = NativeModules.BluetoothManager as
  | BluetoothManagerNative
  | undefined;

const BluetoothEscposPrinter = NativeModules.BluetoothEscposPrinter as
  | BluetoothEscposPrinterNative
  | undefined;

// One-time diagnostic so you can see what's registered.
console.log(
  "🔵 Native Bluetooth modules:",
  Object.keys(NativeModules).filter((key) =>
    key.toLowerCase().includes("bluetooth")
  )
);

function validateNativeModules(): {
  manager: BluetoothManagerNative;
  printer: BluetoothEscposPrinterNative;
} {
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

/* ============================================================
   PERMISSIONS
============================================================ */

async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS !== "android") return true;

  try {
    if (Platform.Version >= 31) {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);

      const scanGranted =
        result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
        PermissionsAndroid.RESULTS.GRANTED;

      const connectGranted =
        result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
        PermissionsAndroid.RESULTS.GRANTED;

      console.log("🔐 Bluetooth SCAN permission:", scanGranted);
      console.log("🔐 Bluetooth CONNECT permission:", connectGranted);

      return scanGranted && connectGranted;
    }

    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    const granted = result === PermissionsAndroid.RESULTS.GRANTED;
    console.log("🔐 Location permission:", granted);
    return granted;
  } catch (error) {
    console.error("❌ Bluetooth permission request failed:", error);
    return false;
  }
}

/**
 * Validate native modules AND ensure permissions are granted.
 * Every public method funnels through here.
 */
async function ensureReady(): Promise<{
  manager: BluetoothManagerNative;
  printer: BluetoothEscposPrinterNative;
}> {
  const mods = validateNativeModules();

  const granted = await requestBluetoothPermissions();
  if (!granted) throw new Error(PERMISSION_DENIED_MESSAGE);

  return mods;
}

/* ============================================================
   PURE HELPERS
============================================================ */

function parseScanResult(result: PrinterResult | string): PrinterResult {
  if (typeof result !== "string") return result;

  try {
    return JSON.parse(result);
  } catch {
    return { paired: [], found: [] };
  }
}

export function formatMoney(value: number): string {
  return (Number(value) || 0).toFixed(2);
}

export function formatNumber(value: number): string {
  const n = Number(value) || 0;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export function truncate(value: string, maxLength: number): string {
  if (!value || value.length <= maxLength) return value ?? "";
  return `${value.substring(0, maxLength - 3)}...`;
}

/**
 * Format a receipt date as `M/D/YYYY HH:mm`.
 *
 * IMPORTANT: If the backend sends a local-time string like
 * "2026-04-13 17:51:00" (no timezone), passing it through
 * `new Date()` will treat it as UTC and shift the hours. We
 * parse that shape manually so the printed time matches the
 * store clock exactly.
 *
 * For true ISO strings (with `Z` or an offset), we fall back
 * to `Date` and use local getters.
 */
function formatReceiptDate(value: string): string {
  if (!value) return "";

  const hasTimezone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(value);

  // Preserve SQL-style timestamps that are already local time.
  const sqlMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/
  );

  if (sqlMatch && !hasTimezone) {
    const [, year, month, day, hours, minutes] = sqlMatch;

    return `${Number(month)}/${Number(day)}/${year} ${hours}:${minutes}`;
  }

  // The API uses DateTime.UtcNow, but its ISO timestamp may not
  // include Z. Treat timezone-free ISO timestamps as UTC.
  const parseValue =
    !hasTimezone && /^\d{4}-\d{2}-\d{2}T/.test(value)
      ? `${value}Z`
      : value;

  const date = new Date(parseValue);

  if (Number.isNaN(date.getTime())) return value;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Harare",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${Number(part("month"))}/${Number(part("day"))}/${part("year")} ${part("hour")}:${part("minute")}`;
}
/** Right-align an amount against a label, padded to receipt width. */
function amountLine(label: string, value: number): string {
  const amount = formatMoney(value);
  const spaces = RECEIPT_WIDTH - label.length - amount.length;
  return label + " ".repeat(Math.max(1, spaces)) + amount + "\n";
}

/** Header row of the item table. */
function itemHeader(): string {
  return (
    "Product".padEnd(27) +
    "Price".padStart(7) +
    "Qty".padStart(5) +
    "Total".padStart(9) +
    "\n"
  );
}

/** One item row of the item table. */
function itemRow(
  productName: string,
  unitPrice: number,
  quantity: number,
  total: number
): string {
  return (
    truncate(productName, 27).padEnd(27) +
    formatMoney(unitPrice).padStart(7) +
    formatNumber(quantity).padStart(5) +
    formatMoney(total).padStart(9) +
    "\n"
  );
}

const LINE = "-".repeat(RECEIPT_WIDTH) + "\n";

/* ============================================================
   PUBLIC SERVICE
============================================================ */

export const printerService = {
  /* ---------- Bluetooth ---------- */

  async isBluetoothEnabled(): Promise<boolean> {
    const { manager } = await ensureReady();
    return manager.isBluetoothEnabled();
  },

  async scanDevices(): Promise<PrinterResult> {
    const { manager } = await ensureReady();

    console.log("🔍 Scanning Bluetooth devices...");
    const parsed = parseScanResult(await manager.scanDevices());

    console.log("🔍 Paired Bluetooth devices:", parsed.paired);
    console.log("🔍 Found Bluetooth devices:", parsed.found);

    return parsed;
  },

  async findPrinter(): Promise<PrinterDevice | null> {
    const result = await this.scanDevices();
    const devices = [...(result.paired ?? []), ...(result.found ?? [])];

    console.log("🖨️ Bluetooth devices:", devices);

    const printer = devices.find(
      (d) => d.name?.toLowerCase() === PRINTER_NAME.toLowerCase()
    );

    if (printer) {
      console.log("✅ BluePeak printer found:", printer);
    } else {
      console.log(`❌ Printer "${PRINTER_NAME}" was not found.`);
    }

    return printer ?? null;
  },

  async connect(): Promise<PrinterDevice> {
    const { manager } = await ensureReady();

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
    console.log("✅ Printer connected.");

    return printer;
  },

  async isConnected(): Promise<boolean> {
    const { manager } = await ensureReady();
    const connected = await manager.isDeviceConnected();
    console.log("🖨️ Printer connected:", connected);
    return connected;
  },

  async getConnectedPrinter(): Promise<PrinterDevice | null> {
    const { manager } = await ensureReady();
    return manager.getConnectedDevice();
  },

  async disconnect(): Promise<void> {
    const { manager } = await ensureReady();
    const address = await manager.getConnectedDeviceAddress();

    if (!address) return;

    console.log(`🔌 Disconnecting printer ${address}...`);
    await manager.disconnect(address);
    console.log("✅ Printer disconnected.");
  },

  /** Connect if not already connected, and return the printer handle. */
  async ensureConnected(): Promise<{
    printer: BluetoothEscposPrinterNative;
    device: PrinterDevice;
  }> {
    const { printer } = await ensureReady();

    if (!(await this.isConnected())) {
      console.log("🔗 Printer is not connected. Connecting...");
      await this.connect();
    }

    const device = (await this.getConnectedPrinter()) ?? {
      name: PRINTER_NAME,
      address: "",
      connected: true,
    };

    return { printer, device };
  },

  /* ---------- Test print ---------- */

  async testPrint(): Promise<void> {
    const { printer } = await this.ensureConnected();

    console.log("🖨️ Starting printer test...");

    await printer.printerInit();

    await printer.printerAlign(1);
    await printer.printText("BLUEPEAK POS\n", {
      widthtimes: 2,
      heigthtimes: 2,
    });
    await printer.printText("PRINTER TEST\n\n", {});

    await printer.printerAlign(0);
    await printer.printText(LINE, {});
    await printer.printText("Printer: RK-E260L\n", {});
    await printer.printText(`Bluetooth: ${PRINTER_NAME}\n`, {});
    await printer.printText("Status: Connected\n", {});
    await printer.printText(LINE, {});

    await printer.printerAlign(1);
    await printer.printText("Bluetooth printing works!\n\n", {});

    /**
     * Feed past the print head so the cutter can reach
     * the blank section. RK-E260L cutter is ~10–15mm below
     * the print head. Plain \n, never \n\r.
     */
    await printer.printText("\n".repeat(15), {});

    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      await printer.cutPaper();
      console.log("✂️ Test paper cut successfully.");
    } catch (error) {
      console.log("⚠️ Paper cutter not available:", error);
    }

    console.log("✅ Printer test completed.");
  },

  /* ---------- Receipt ---------- */

  async printReceipt(receipt: Receipt): Promise<void> {
    console.log("🧾 Printing Coldstone receipt:", receipt.saleId);
    console.log(
      "🧾 Receipt payload:",
      JSON.stringify(
        {
          saleId: receipt.saleId,
          saleDate: receipt.saleDate,
          customerName: receipt.customerName,
          cashier: receipt.cashier,
        },
        null,
        2
      )
    );

    const { printer } = await this.ensureConnected();

    await printer.printerInit();

    /* ----- HEADER ----- */
    await printer.printerAlign(1);
    await printer.printText("COLDSTONE ", {
      widthtimes: 2,
      heigthtimes: 1,
    });
    await printer.printText("\n", { widthtimes: 1, heigthtimes: 1 });
    await printer.printText("\n", {});

    /* ----- STORE / INVOICE ----- */
    await printer.printerAlign(0);
    await printer.printText("ADDRESS : 2 STIRLING ROAD HARARE\n", {});
    await printer.printText("CONTACT : 0242750738\n", {});
    await printer.printText(`Invoice: ${receipt.saleId}\n`, {});
    await printer.printText(
      `${formatReceiptDate(receipt.saleDate)}\n`,
      {}
    );
    await printer.printText(LINE, {});

    /* ----- CUSTOMER DETAILS ----- */
    // Defensive: only accept a real string. If it's an object like
    // { name: "John" }, unwrap it. Otherwise fall back to walk-in.
    const rawCustomer: unknown = receipt.customerName;

    let customerName = "";
    if (typeof rawCustomer === "string") {
      customerName = rawCustomer.trim();
    } else if (
      rawCustomer &&
      typeof rawCustomer === "object" &&
      "name" in rawCustomer &&
      typeof (rawCustomer as { name?: unknown }).name === "string"
    ) {
      customerName = ((rawCustomer as { name: string }).name ?? "").trim();
    }

    console.log(
      "🧾 Raw customerName:",
      JSON.stringify(rawCustomer),
      "→ resolved:",
      JSON.stringify(customerName)
    );

    await printer.printText(
      `Customer: ${customerName || "Walk-in Customer"}\n`,
      {}
    );

    await printer.printText(LINE, {});

    /* ----- ITEMS TABLE ----- */
    await printer.printText(itemHeader(), {});
    await printer.printText(LINE, {});

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

    await printer.printText(LINE, {});

    /* ----- GROSS TOTAL ----- */
    const totalQuantity = receipt.items.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );

    await printer.printText(
      "Gross Total:".padStart(35) +
        String(totalQuantity).padStart(5) +
        " " +
        formatMoney(receipt.subtotal).padStart(7) +
        "\n",
      {}
    );
    await printer.printText(LINE, {});

    /* ----- TOTALS ----- */
    await printer.printText(amountLine("Net Total:", receipt.total), {});
    await printer.printText(amountLine("USD paid:", receipt.amountPaid), {});

    if (receipt.changeGiven >= 0) {
      await printer.printText(
        amountLine("Balance:", receipt.changeGiven),
        {}
      );
    } else {
      await printer.printText(
        amountLine("Balance Due:", Math.abs(receipt.changeGiven)),
        {}
      );
    }

    /* ----- CASHIER ----- */
    await printer.printText(LINE, {});
    await printer.printText(`Sales Person: ${receipt.cashier}\n`, {});

    /* ----- FOOTER ----- */
    await printer.printText(LINE, {});
    await printer.printerAlign(1);

    await printer.printText("Thank you for shopping with us\n", {});
    await printer.printText("Please come back soon\n\n", { cut: true });

    console.log("✂️ Receipt printed and cutter command sent.");
    console.log("✅ Coldstone receipt printed successfully.");
  },
};