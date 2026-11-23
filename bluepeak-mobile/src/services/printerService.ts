import {
  NativeModules,
  PermissionsAndroid,
  Platform,
} from "react-native";
import { getUser } from "../storage/authStorage";
import { API_BASE_URL } from "../config/api";
import {
  saveSelectedPrinter,
  getSelectedPrinter as getSavedSelectedPrinter,
  clearSelectedPrinter,
} from "../storage/printerStorage";

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
  receiptToken?: string | null;
  cashier: string;
  paymentMethod: string;
  subtotal: number;
  //vat: number;
  total: number;
  amountPaid: number;
  changeGiven: number;
  customerName?: string | null;
  organisationName?: string;
organisationAddress?: string | null;
organisationPhoneNumber?: string | null;
organisationEmail?: string | null;
organisationLogoUrl?: string | null;
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

    console.log("Scanning Bluetooth devices...");

    const parsed = parseScanResult(await manager.scanDevices());

    const paired = parsed.paired ?? [];
    const found = parsed.found ?? [];

    // Remove duplicate devices using their Bluetooth addresses.
    const uniqueDevices = new Map<string, PrinterDevice>();

    [...paired, ...found].forEach((device) => {
      if (device.address) {
        uniqueDevices.set(device.address.toLowerCase(), device);
      }
    });

    const devices = Array.from(uniqueDevices.values());

    console.log("Available Bluetooth devices:", devices);

    return {
      paired: devices.filter((device) =>
        paired.some(
          (item) =>
            item.address?.toLowerCase() ===
            device.address?.toLowerCase()
        )
      ),
      found: devices.filter(
        (device) =>
          !paired.some(
            (item) =>
              item.address?.toLowerCase() ===
              device.address?.toLowerCase()
          )
      ),
    };
  },

  async getSelectedPrinter(): Promise<PrinterDevice | null> {
    const saved = await getSavedSelectedPrinter();

    if (!saved) return null;

    return {
      name: saved.name,
      address: saved.address,
    };
  },

  async selectPrinter(device: PrinterDevice): Promise<PrinterDevice> {
    if (!device.name || !device.address) {
      throw new Error("Invalid printer selection.");
    }

    const { manager } = await ensureReady();

    console.log(
      `Selecting printer: ${device.name} (${device.address})`
    );

    // Disconnect an existing connection if it belongs to another device.
    const currentAddress =
      await manager.getConnectedDeviceAddress();

    if (
      currentAddress &&
      currentAddress.toLowerCase() !== device.address.toLowerCase()
    ) {
      await manager.disconnect(currentAddress);
    }

    // Persist the selection so it survives application restarts.
    await saveSelectedPrinter({
      name: device.name,
      address: device.address,
    });

    // Connect to the selected printer.
    await manager.connect(device.address);

    console.log(`Connected to ${device.name}`);

    return {
      ...device,
      connected: true,
    };
  },

  async connect(): Promise<PrinterDevice> {
    const { manager } = await ensureReady();

    const selected = await getSavedSelectedPrinter();

    if (!selected) {
      throw new Error(
        "No printer selected. Scan for printers and select one first."
      );
    }

    console.log(
      `Connecting to ${selected.name} (${selected.address})...`
    );

    await manager.connect(selected.address);

    console.log(`Connected to ${selected.name}`);

    return {
      ...selected,
      connected: true,
    };
  },

  async isConnected(): Promise<boolean> {
    const { manager } = await ensureReady();

    return manager.isDeviceConnected();
  },

  async getConnectedPrinter(): Promise<PrinterDevice | null> {
    const { manager } = await ensureReady();

    return manager.getConnectedDevice();
  },

  async disconnect(): Promise<void> {
    const { manager } = await ensureReady();

    const address = await manager.getConnectedDeviceAddress();

    if (!address) return;

    console.log(`Disconnecting printer ${address}...`);

    await manager.disconnect(address);
  },

  async forgetSelectedPrinter(): Promise<void> {
    await this.disconnect();
    await clearSelectedPrinter();

    console.log("Selected printer forgotten.");
  },

  /**
   * Connect to the saved printer if it is not already connected.
   */
  async ensureConnected(): Promise<{
    printer: BluetoothEscposPrinterNative;
    device: PrinterDevice;
  }> {
    const { printer, manager } = await ensureReady();

    let connected = await manager.isDeviceConnected();

    let device = connected
      ? await manager.getConnectedDevice()
      : null;

    const selected = await getSavedSelectedPrinter();

    if (!selected) {
      throw new Error(
        "No printer selected. Open printer settings and select a printer."
      );
    }

    // If a different printer is connected, switch to the saved selection.
    const currentAddress =
      await manager.getConnectedDeviceAddress();

    if (
      connected &&
      currentAddress &&
      currentAddress.toLowerCase() !==
        selected.address.toLowerCase()
    ) {
      await manager.disconnect(currentAddress);
      connected = false;
      device = null;
    }

    if (!connected) {
      console.log(`Reconnecting to ${selected.name}...`);

      await manager.connect(selected.address);
      connected = true;
    }

    device = (await manager.getConnectedDevice()) ?? {
      name: selected.name,
      address: selected.address,
      connected: true,
    };

    return {
      printer,
      device: {
        ...device,
        connected: true,
      },
    };
  },

  /* ---------- Test print ---------- */

  async testPrint(): Promise<void> {
    const { printer, device } = await this.ensureConnected();

    console.log(`Testing printer: ${device.name}`);

    await printer.printerInit();

    await printer.printerAlign(1);

    await printer.printText("BLUEPEAK POS\n", {
      widthtimes: 2,
      heigthtimes: 2,
    });

    await printer.printText("PRINTER TEST\n\n", {});

    await printer.printerAlign(0);

    await printer.printText(LINE, {});
    await printer.printText(`Printer: ${device.name}\n`, {});
    await printer.printText(`Bluetooth: ${device.address}\n`, {});
    await printer.printText("Status: Connected\n", {});
    await printer.printText(LINE, {});

    await printer.printerAlign(1);

    await printer.printText(
      "Bluetooth printing works!\n\n",
      {}
    );

    // Feed paper before attempting to cut.
    await printer.printText("\n".repeat(15), {});

    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      await printer.cutPaper();
      console.log("Paper cut successfully.");
    } catch (error) {
      console.log("Paper cutter not available:", error);
    }

    console.log("Printer test completed.");
  },

  /* ---------- Receipt ---------- */
  /* ---------- Receipt ---------- */
async printReceipt(receipt: Receipt): Promise<void> {
    console.log("Printing receipt:", receipt.saleId);

    const { printer } = await this.ensureConnected();

    await printer.printerInit();

    const cachedUser = await getUser();

    const organisationName =
        receipt.organisationName?.trim() ||
        cachedUser?.organisationName?.trim() ||
        "COLDSTONE TRADING";

    const organisationAddress =
        receipt.organisationAddress?.trim() ||
        cachedUser?.organisationAddress?.trim() ||
        "";

    const organisationPhone =
        receipt.organisationPhoneNumber?.trim() ||
        cachedUser?.organisationPhoneNumber?.trim() ||
        "";

    const width = RECEIPT_WIDTH;

    const line = "-".repeat(width) + "\n";

    const money = (value: number) =>
        formatMoney(value);

    const rightAlign = (value: string) =>
        value.padStart(width);

    const amountLine = (label: string, value: number) => {
        const amount = `$ ${money(value)}`;

        return (
            label +
            amount.padStart(Math.max(1, width - label.length)) +
            "\n"
        );
    };

    const wrapText = (value: string, maxWidth: number) => {
        const words = value.split(/\s+/);
        const lines: string[] = [];
        let current = "";

        for (const word of words) {
            if (!word) continue;

            if ((current + " " + word).trim().length > maxWidth) {
                if (current) lines.push(current);
                current = word;
            } else {
                current = (current + " " + word).trim();
            }
        }

        if (current) lines.push(current);

        return lines;
    };

    /* =========================
       BUSINESS HEADER
    ========================= */

    await printer.printerAlign(0);

    await printer.printText(
        `${organisationName.toUpperCase()}\n`,
        { widthtimes: 1, heigthtimes: 1 }
    );

    if (organisationAddress) {
        const addressLines = wrapText(
            organisationAddress,
            width
        );

        for (const address of addressLines) {
            await printer.printText(`${address}\n`, {});
        }
    }

    if (organisationPhone) {
        await printer.printText(
            `Cell: ${organisationPhone}\n`,
            {}
        );
    }

    /* =========================
       DATE AND TIME
    ========================= */

    const formattedDate = formatReceiptDate(receipt.saleDate);

    const dateParts = formattedDate.split(" ");

    const date = dateParts[0] || "";
    const time = dateParts[1] || "";

    await printer.printText("\n", {});

    await printer.printerAlign(2);

    await printer.printText(`${date}\n`, {});
    await printer.printText(`${time}\n`, {});

    /* =========================
       INVOICE NUMBER
    ========================= */

    await printer.printerAlign(0);

    await printer.printText(
        `INVOICE: ${receipt.saleId}\n`,
        {}
    );

    await printer.printText(line, {});

    /* =========================
       ITEMS
    ========================= */

    for (const item of receipt.items) {
        const quantity = formatNumber(item.quantity);

        const productName = item.productName || "Unknown Product";

        const itemDescription =
            `${quantity} x ${productName}`;

        const itemAmount = money(item.total);

        const availableNameWidth =
            width - itemAmount.length - 1;

        const descriptionLines = wrapText(
            itemDescription,
            availableNameWidth
        );

        for (let index = 0; index < descriptionLines.length; index++) {
            if (index === 0) {
                const description =
                    descriptionLines[index];

                await printer.printText(
                    description.padEnd(availableNameWidth) +
                    itemAmount +
                    "\n",
                    {}
                );
            } else {
                await printer.printText(
                    `${descriptionLines[index]}\n`,
                    {}
                );
            }
        }
    }

    await printer.printText("\n", {});

    /* =========================
       PAYMENT SUMMARY
    ========================= */

    await printer.printText(
        amountLine("Total $", receipt.total),
        {}
    );

    await printer.printText(
        amountLine("USD Paid $", receipt.amountPaid),
        {}
    );

    await printer.printText(
        amountLine("Change $", receipt.changeGiven),
        {}
    );

    /* =========================
       CASHIER
    ========================= */

    await printer.printText("\n", {});

    await printer.printerAlign(1);

    await printer.printText(
        `You were served by ${receipt.cashier || "Staff"}\n`,
        {}
    );

    /* =========================
       FOOTER
    ========================= */

    await printer.printText(
        "God bless you\n\n\n",
        {}
    );

    await printer.printerAlign(0);

    // Feed paper before cutting.
    await printer.printText("\n\n", {});

    try {
        await printer.cutPaper();
    } catch (error) {
        console.log("Paper cutter unavailable:", error);
    }

    console.log("Receipt printed successfully.");
},
}
