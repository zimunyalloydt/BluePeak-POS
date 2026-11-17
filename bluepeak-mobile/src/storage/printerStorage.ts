import * as SecureStore from "expo-secure-store";

const SELECTED_PRINTER_KEY = "bluepeak_selected_printer";

export interface SavedPrinter {
    name: string;
    address: string;
}

export async function saveSelectedPrinter(
    printer: SavedPrinter
): Promise<void> {
    await SecureStore.setItemAsync(
        SELECTED_PRINTER_KEY,
        JSON.stringify(printer)
    );
}

export async function getSelectedPrinter(): Promise<SavedPrinter | null> {
    try {
        const stored = await SecureStore.getItemAsync(
            SELECTED_PRINTER_KEY
        );

        if (!stored) return null;

        const printer = JSON.parse(stored) as SavedPrinter;

        if (!printer.name || !printer.address) {
            return null;
        }

        return printer;
    } catch (error) {
        console.error("Failed to retrieve selected printer:", error);
        return null;
    }
}

export async function clearSelectedPrinter(): Promise<void> {
    await SecureStore.deleteItemAsync(SELECTED_PRINTER_KEY);
}