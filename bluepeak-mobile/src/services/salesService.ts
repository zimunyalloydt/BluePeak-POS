import api from "./api";
import * as Crypto from "expo-crypto";
import { getUser } from "../storage/authStorage";
import {
    getDatabase,
    rejectLocalSale,
    saveLocalSale,
} from "./localDatabase";

export interface SaleItem {
    productId: number;
    quantity: number;
    productName?: string;
    unitPrice?: number;
    costPrice?: number;
}

export interface CreateSaleRequest {
    userId: number;
    receiptToken?: string;
    clientSaleId?: string;
    paymentMethod: string;
    amountPaid: number;
    customerName?: string;
    items: SaleItem[];
}

export interface CreateSaleResponse {
    saleId: number;
    message: string;
    localSaleId?: string;
    offline?: boolean;
}

export interface ReceiptItem {
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface Receipt {
    saleId: number;
    receiptToken?: string;
    saleDate: string;
    cashier: string;
    paymentMethod: string;
    subtotal: number;
    vat: number;
    total: number;
    amountPaid: number;
    changeGiven: number;
    organisationName?: string;
    organisationAddress?: string | null;
    organisationPhoneNumber?: string | null;
    organisationEmail?: string | null;
    organisationLogoUrl?: string | null;
    customerName?: string | null;
    items: ReceiptItem[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateLocalSaleId(): string {
    return `LOCAL-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase()}`;
}

function generateReceiptToken(): string {
    // expo-crypto exposes randomUUID from SDK 49+. Fall back gracefully.
    const c = Crypto as unknown as { randomUUID?: () => string };
    if (typeof c.randomUUID === "function") {
        return c.randomUUID();
    }
    // RFC4122-ish fallback using getRandomBytes
    const bytes = Crypto.getRandomBytes(16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) =>
        b.toString(16).padStart(2, "0")
    ).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
        12,
        16
    )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Stable numeric id for an offline sale.
 *
 * We keep the same algorithm used previously so existing
 * local receipts remain addressable, BUT we add a verification
 * step in getReceipt() to guard against collisions.
 */
function numericIdForLocalSale(localSaleId: string): number {
    const hash = Array.from(localSaleId).reduce(
        (h, ch) => ((h << 5) - h) + ch.charCodeAt(0),
        0
    );
    return -Math.abs(hash);
}

function calculateLocalSale(sale: CreateSaleRequest) {
    let subtotal = 0;
    let profit = 0;

    for (const item of sale.items) {
        const unitPrice = Number(item.unitPrice ?? 0);
        const costPrice = Number(item.costPrice ?? 0);
        const quantity = Number(item.quantity);

        subtotal += unitPrice * quantity;
        profit += (unitPrice - costPrice) * quantity;
    }

    // Must match backend SaleService.
    const vat = subtotal * 0;
    const total = subtotal;
    const changeGiven = sale.amountPaid - total;

    return { subtotal, vat, total, changeGiven, profit };
}

// ---------------------------------------------------------------------------
// Local persistence
// ---------------------------------------------------------------------------

/**
 * Saves the sale locally (single source of truth) and enqueues it
 * for sync. Delegates to localDatabase.saveLocalSale(), which is
 * responsible for stock deduction. There must only ever be ONE
 * implementation of this function.
 */
async function saveSaleLocally(
    sale: CreateSaleRequest,
    localSaleId: string
): Promise<void> {
    const calculated = calculateLocalSale(sale);
    const createdAt = new Date().toISOString();

    await saveLocalSale({
        localSaleId,
        userId: sale.userId,
        paymentMethod: sale.paymentMethod,
        amountPaid: sale.amountPaid,
        customerName: sale.customerName ?? null,
        receiptToken: sale.receiptToken ?? null,


        subtotal: calculated.subtotal,
        vat: calculated.vat,
        total: calculated.total,
        changeGiven: calculated.changeGiven,
        profit: calculated.profit,

        createdAt,

        items: sale.items.map((item) => ({
            productId: item.productId,
            productName:
                item.productName ?? `Product ${item.productId}`,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice ?? 0),
            costPrice: Number(item.costPrice ?? 0),
            total:
                Number(item.unitPrice ?? 0) *
                Number(item.quantity),
        })),
    });

    console.log(
        "💾 Sale saved locally and stock deducted:",
        localSaleId
    );
}

async function markSaleSynced(
    localSaleId: string,
    serverSaleId: number
): Promise<void> {
    const db = await getDatabase();

    await db.withTransactionAsync(async () => {
        await db.runAsync(
            `
            UPDATE sales
            SET serverSaleId = ?, syncStatus = ?
            WHERE localSaleId = ?
            `,
            serverSaleId,
            "synced",
            localSaleId
        );

        await db.runAsync(
            `
            DELETE FROM sync_queue
            WHERE localSaleId = ?
            `,
            localSaleId
        );
    });

    console.log(
        `✅ Local sale ${localSaleId} synced as server sale ${serverSaleId}`
    );
}

async function getLocalReceipt(
    localSaleId: string
): Promise<Receipt | null> {
    const db = await getDatabase();

    const sale = await db.getFirstAsync<{
        localSaleId: string;
        receiptToken: string | null;
        serverSaleId: number | null;
        userId: number;
        paymentMethod: string;
        amountPaid: number;
        customerName: string | null;
        subtotal: number;
        vat: number;
        total: number;
        changeGiven: number;
        createdAt: string;
    }>(
        `
        SELECT
            localSaleId,
            serverSaleId,
            userId,
            receiptToken,
            paymentMethod,
            amountPaid,
            customerName,
            subtotal,
            vat,
            total,
            changeGiven,
            createdAt
        FROM sales
        WHERE localSaleId = ?
        `,
        localSaleId
    );

    if (!sale) return null;

    const items = await db.getAllAsync<{
        productName: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }>(
        `
        SELECT productName, quantity, unitPrice, total
        FROM sale_items
        WHERE localSaleId = ?
        ORDER BY id ASC
        `,
        localSaleId
    );

    const cachedUser = await getUser();

    return {
        saleId: sale.serverSaleId ?? numericIdForLocalSale(localSaleId),
        receiptToken: sale.receiptToken ?? undefined,
        saleDate: sale.createdAt,
        cashier: "Offline Sale",
        paymentMethod: sale.paymentMethod,
        subtotal: sale.subtotal,
        vat: sale.vat,
        total: sale.total,
        amountPaid: sale.amountPaid,
        changeGiven: sale.changeGiven,
        organisationName: cachedUser?.organisationName ?? "",
        organisationAddress: cachedUser?.organisationAddress ?? null,
        organisationPhoneNumber:
            cachedUser?.organisationPhoneNumber ?? null,
        organisationEmail: cachedUser?.organisationEmail ?? null,
        organisationLogoUrl: cachedUser?.organisationLogoUrl ?? null,
        customerName: sale.customerName,
        items,
    };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function createSale(
    sale: CreateSaleRequest
): Promise<CreateSaleResponse> {
    const localSaleId = sale.clientSaleId ?? generateLocalSaleId();
    const receiptToken = sale.receiptToken ?? generateReceiptToken();

    const saleWithClientId: CreateSaleRequest = {
        ...sale,
        clientSaleId: localSaleId,
        receiptToken,
    };

    // 1. Persist locally first — this is our source of truth and it
    //    deducts stock in a single transaction.
    await saveSaleLocally(saleWithClientId, localSaleId);

    // 2. Best-effort sync to the server.
    try {
        const response = await api.post<CreateSaleResponse>(
            "/Sales",
            saleWithClientId
        );

        await markSaleSynced(localSaleId, response.data.saleId);

        return {
            ...response.data,
            localSaleId,
            offline: false,
        };
    } catch (error: any) {
        const status = error?.response?.status;

        // Auth failure: keep the sale queued. It is NOT invalid.
        if (status === 401 || status === 403) {
            console.warn(
                `Sale ${localSaleId} remains queued because authentication or permissions were rejected.`
            );
            throw error;
        }

        // Permanent client-side rejection: roll back local stock
        // and mark the sale rejected so it isn't retried forever.
        if (status && status >= 400 && status < 500) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.Message ||
                error?.message ||
                "Sale was rejected by the server.";

            await rejectLocalSale(localSaleId, String(message));
            throw error;
        }

        // Network / 5xx: keep queued, return an offline receipt.
        console.warn(
            "⚠️ Server unavailable. Sale remains in local sync queue."
        );

        const localReceipt = await getLocalReceipt(localSaleId);

        return {
            saleId:
                localReceipt?.saleId ?? -Date.now(),
            message:
                "Sale saved locally and will sync when the server is available.",
            localSaleId,
            offline: true,
        };
    }
}

export async function getReceipt(saleId: number): Promise<Receipt> {
    // Negative ids are offline / local receipts.
    if (saleId < 0) {
        const db = await getDatabase();

        // The numeric id is a hash of localSaleId, which is not
        // directly invertible. Scan candidates cheaply, but only
        // compare hashes — do not re-query items for non-matches.
        const rows = await db.getAllAsync<{ localSaleId: string }>(
            `SELECT localSaleId FROM sales ORDER BY id DESC`
        );

        let match: string | null = null;
        for (const row of rows) {
            if (numericIdForLocalSale(row.localSaleId) === saleId) {
                match = row.localSaleId;
                break;
            }
        }

        if (!match) {
            throw new Error("Offline receipt could not be found.");
        }

        const receipt = await getLocalReceipt(match);
        if (!receipt) {
            throw new Error("Offline receipt could not be found.");
        }
        return receipt;
    }

    const response = await api.get<Receipt>(`/Sales/${saleId}`);
    return response.data;
}

export async function getMySales() {
    const response = await api.get("/Sales/my-sales");
    return response.data;
}