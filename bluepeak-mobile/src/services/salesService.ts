import api from "./api";
import {
    getDatabase,
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
    saleDate: string;
    cashier: string;
    paymentMethod: string;
    subtotal: number;
    vat: number;
    total: number;
    amountPaid: number;
    changeGiven: number;
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
    const vat = subtotal * 0.15;
    const total = subtotal + vat;
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
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                localSaleId,
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

    return {
        saleId:
            sale.serverSaleId ??
            numericLocalId,

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

    const saleWithClientId: CreateSaleRequest = {
        ...sale,
        clientSaleId: localSaleId,
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

        /*
         * Do NOT silently convert normal API errors
         * such as 400/401/403 into offline sales.
         *
         * Network errors and server 5xx errors can
         * safely remain in the sync queue.
         */
        const status =
            error?.response?.status;

        if (
            status &&
            status >= 400 &&
            status < 500
        ) {
            throw error;
        }

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