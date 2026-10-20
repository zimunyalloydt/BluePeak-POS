import api from "./api";
import * as Crypto from "expo-crypto";
import { getUser } from "../storage/authStorage";
import {
    getDatabase,
    rejectLocalSale,
} from "./localDatabase";

export interface SaleItem {
    productId: number;
    quantity: number;

    // Used for local/offline receipt generation.
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

function generateLocalSaleId(): string {
    return `LOCAL-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase()}`;
}

function calculateLocalSale(
    sale: CreateSaleRequest
) {
    let subtotal = 0;
    let profit = 0;

    for (const item of sale.items) {
        const unitPrice = Number(item.unitPrice ?? 0);
        const costPrice = Number(item.costPrice ?? 0);
        const quantity = Number(item.quantity);

        subtotal += unitPrice * quantity;
        profit +=
            (unitPrice - costPrice) *
            quantity;
    }

    // Must match backend SaleService.
    const vat = subtotal * 0;
    const total = subtotal;
    const changeGiven =
        sale.amountPaid - total;

    return {
        subtotal,
        vat,
        total,
        changeGiven,
        profit,
    };
}

async function saveSaleLocally(
    sale: CreateSaleRequest,
    localSaleId: string
): Promise<void> {
    const db = await getDatabase();

    const calculated =
        calculateLocalSale(sale);

    const clientSaleId =
        sale.clientSaleId ?? localSaleId;

    const createdAt =
        new Date().toISOString();

    await db.withTransactionAsync(
        async () => {
            await db.runAsync(
                `
                INSERT INTO sales (
                    localSaleId,
                    receiptToken,
                    userId,
                    paymentMethod,
                    amountPaid,
                    customerName,
                    subtotal,
                    vat,
                    total,
                    changeGiven,
                    profit,
                    createdAt,
                    syncStatus
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                localSaleId,
                sale.receiptToken ?? null,
                sale.userId,
                sale.paymentMethod,
                sale.amountPaid,
                sale.customerName ?? null,
                calculated.subtotal,
                calculated.vat,
                calculated.total,
                calculated.changeGiven,
                calculated.profit,
                createdAt,
                "pending"
            );

            for (const item of sale.items) {
                const unitPrice =
                    Number(item.unitPrice ?? 0);

                const costPrice =
                    Number(item.costPrice ?? 0);

                const quantity =
                    Number(item.quantity);

                await db.runAsync(
                    `
                    INSERT INTO sale_items (
                        localSaleId,
                        productId,
                        productName,
                        quantity,
                        unitPrice,
                        costPrice,
                        total
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    `,
                    localSaleId,
                    item.productId,
                    item.productName ??
                        `Product ${item.productId}`,
                    quantity,
                    unitPrice,
                    costPrice,
                    unitPrice * quantity
                );
            }

            await db.runAsync(
                `
                INSERT INTO sync_queue (
                    localSaleId,
                    status,
                    attempts,
                    createdAt
                )
                VALUES (?, ?, ?, ?)
                `,
                localSaleId,
                "pending",
                0,
                createdAt
            );
        }
    );

    console.log(
        "💾 Sale saved locally:",
        localSaleId
    );

    console.log(
        "🔑 ClientSaleId:",
        clientSaleId
    );
}

async function markSaleSynced(
    localSaleId: string,
    serverSaleId: number
): Promise<void> {
    const db = await getDatabase();

    await db.withTransactionAsync(
        async () => {
            await db.runAsync(
                `
                UPDATE sales
                SET
                    serverSaleId = ?,
                    syncStatus = ?
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
        }
    );

    console.log(
        `✅ Local sale ${localSaleId} synced as server sale ${serverSaleId}`
    );
}

async function getLocalReceipt(
    localSaleId: string
): Promise<Receipt | null> {
    const db = await getDatabase();

    const sale =
        await db.getFirstAsync<{
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

    if (!sale) {
        return null;
    }

    const items =
        await db.getAllAsync<{
            productName: string;
            quantity: number;
            unitPrice: number;
            total: number;
        }>(
            `
            SELECT
                productName,
                quantity,
                unitPrice,
                total
            FROM sale_items
            WHERE localSaleId = ?
            ORDER BY id ASC
            `,
            localSaleId
        );

    const numericLocalId =
        -Math.abs(
            Array.from(localSaleId)
                .reduce(
                    (hash, char) =>
                        ((hash << 5) - hash) +
                        char.charCodeAt(0),
                    0
                )
        );

    const cachedUser = await getUser();

    return {
        saleId:
            sale.serverSaleId ??
            numericLocalId,
        receiptToken: sale.receiptToken ?? undefined,
        saleDate: sale.createdAt,
        cashier: "Offline Sale",
        paymentMethod:
            sale.paymentMethod,
        subtotal: sale.subtotal,
        vat: sale.vat,
        total: sale.total,
        amountPaid: sale.amountPaid,
        changeGiven:
            sale.changeGiven,

        organisationName:
            cachedUser?.organisationName ?? "",

        organisationAddress:
            cachedUser?.organisationAddress ?? null,

        organisationPhoneNumber:
            cachedUser?.organisationPhoneNumber ?? null,

        organisationEmail:
            cachedUser?.organisationEmail ?? null,

        organisationLogoUrl:
            cachedUser?.organisationLogoUrl ?? null,

        customerName:
            sale.customerName,
        items,
    };
}

export async function createSale(
    sale: CreateSaleRequest
): Promise<CreateSaleResponse> {
    /*
     * =====================================================
     * 1. GENERATE THE CLIENT SALE ID
     * =====================================================
     *
     * This ID belongs to this particular sale.
     *
     * If the phone uploads the same sale five times,
     * the backend will recognise all five requests
     * as the same sale.
     */
    const localSaleId =
        sale.clientSaleId ??
        generateLocalSaleId();

    const receiptToken =
        sale.receiptToken ??
        Crypto.randomUUID();

    const saleWithClientId: CreateSaleRequest = {
        ...sale,
        clientSaleId: localSaleId,
        receiptToken,
    };

    /*
     * =====================================================
     * 2. SAVE LOCALLY FIRST
     * =====================================================
     *
     * The sale is now safe on the phone before we
     * even attempt the network.
     */
    await saveSaleLocally(
        saleWithClientId,
        localSaleId
    );

    /*
     * =====================================================
     * 3. TRY TO SYNC TO SERVER
     * =====================================================
     */
    try {
        const response =
            await api.post<CreateSaleResponse>(
                "/Sales",
                saleWithClientId
            );

        const serverSaleId =
            response.data.saleId;

        /*
         * The server accepted the sale.
         * Mark the local copy as synced.
         */
        await markSaleSynced(
            localSaleId,
            serverSaleId
        );

        return {
            ...response.data,
            localSaleId,
            offline: false,
        };
    } catch (error: any) {
        const status =
            error?.response?.status;

        /*
         * Authentication failures are not proof that a sale
         * is invalid. Keep the local sale and stock deduction.
         * It can be retried after the cashier authenticates online.
         */
        if (status === 401 || status === 403) {
            console.warn(
                `Sale ${localSaleId} remains queued because authentication or permissions were rejected.`
            );

            throw error;
        }

        /*
         * Other client errors may indicate invalid sale data.
         * The sale was already saved locally and cached stock
         * was already deducted. Since the server permanently
         * rejected this sale, restore the local stock and
         * prevent the sale from being retried.
         */
        if (status && status >= 400 && status < 500) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.Message ||
                error?.message ||
                "Sale was rejected by the server.";

            await rejectLocalSale(
                localSaleId,
                String(message)
            );

            throw error;
        }

        /*
         * Network failures and server errors leave the sale
         * in the queue for a future synchronisation attempt.
         */
        console.warn(
            "⚠️ Server unavailable. Sale remains in local sync queue."
        );

        const localReceipt =
            await getLocalReceipt(
                localSaleId
            );

        return {
            saleId:
                localReceipt?.saleId ??
                -Date.now(),

            message:
                "Sale saved locally and will sync when the server is available.",

            localSaleId,
            offline: true,
        };
    }
}

export async function getReceipt(
    saleId: number
): Promise<Receipt> {
    /*
     * Negative SaleId means the receipt is
     * currently local/offline.
     */
    if (saleId < 0) {
        const db =
            await getDatabase();

        const sales =
            await db.getAllAsync<{
                localSaleId: string;
            }>(
                `
                SELECT localSaleId
                FROM sales
                ORDER BY id DESC
                `
            );

        for (const sale of sales) {
            const receipt =
                await getLocalReceipt(
                    sale.localSaleId
                );

            if (
                receipt?.saleId ===
                saleId
            ) {
                return receipt;
            }
        }

        throw new Error(
            "Offline receipt could not be found."
        );
    }

    /*
     * Positive SaleId means it has a
     * server-side ID.
     */
    const response =
        await api.get<Receipt>(
            `/Sales/${saleId}`
        );

    return response.data;
}

export async function getMySales() {
    const response =
        await api.get(
            "/Sales/my-sales"
        );

    return response.data;
}