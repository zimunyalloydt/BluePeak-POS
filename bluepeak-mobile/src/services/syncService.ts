import api from "./api";
import { getDatabase , rejectLocalSale,} from "./localDatabase";

interface LocalSale {
    localSaleId: string;
    userId: number;
    paymentMethod: string;
    amountPaid: number;
    customerName: string | null;
    syncStatus: string;
}

interface LocalSaleItem {
    productId: number;
    quantity: number;
}

interface SyncResult {
    localSaleId: string;
    success: boolean;
    serverSaleId?: number;
    error?: string;
}

/**
 * Get all sales that are waiting to be synchronized.
 */
async function getPendingSales(): Promise<LocalSale[]> {
    const db = await getDatabase();

    return await db.getAllAsync<LocalSale>(
        `
        SELECT
            s.localSaleId,
            s.userId,
            s.paymentMethod,
            s.amountPaid,
            s.customerName,
            s.syncStatus
        FROM sales s
        INNER JOIN sync_queue q
            ON q.localSaleId = s.localSaleId
        WHERE
            s.syncStatus = 'pending'
            AND q.status IN ('pending', 'failed')
        ORDER BY s.id ASC
        `
    );
}

/**
 * Get the products/items belonging to one local sale.
 */
async function getSaleItems(
    localSaleId: string
): Promise<LocalSaleItem[]> {
    const db = await getDatabase();

    return await db.getAllAsync<LocalSaleItem>(
        `
        SELECT
            productId,
            quantity
        FROM sale_items
        WHERE localSaleId = ?
        ORDER BY id ASC
        `,
        localSaleId
    );
}

/**
 * Mark a local sale as successfully synchronized.
 */
async function markSaleSynced(
    localSaleId: string,
    serverSaleId: number
): Promise<void> {
    const db = await getDatabase();

    await db.withTransactionAsync(async () => {
        await db.runAsync(
            `
            UPDATE sales
            SET
                serverSaleId = ?,
                syncStatus = 'synced'
            WHERE localSaleId = ?
            `,
            serverSaleId,
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
        `✅ Synced ${localSaleId} → Server Sale #${serverSaleId}`
    );
}

/**
 * Record a failed synchronization attempt.
 *
 * The sale remains safely stored locally.
 */
async function markSyncFailed(
    localSaleId: string,
    errorMessage: string
): Promise<void> {
    const db = await getDatabase();

    await db.runAsync(
        `
        UPDATE sync_queue
        SET
            status = 'failed',
            attempts = attempts + 1,
            lastAttemptAt = ?,
            errorMessage = ?
        WHERE localSaleId = ?
        `,
        new Date().toISOString(),
        errorMessage,
        localSaleId
    );

    console.warn(
        `⚠️ Sync failed for ${localSaleId}: ${errorMessage}`
    );
}

/**
 * Synchronize one local sale with the server.
 */
async function syncOneSale(
    sale: LocalSale
): Promise<SyncResult> {
    try {
        const items =
            await getSaleItems(
                sale.localSaleId
            );

        if (items.length === 0) {
            throw new Error(
                "Local sale has no sale items."
            );
        }

        /*
         * IMPORTANT:
         *
         * localSaleId is also the ClientSaleId
         * sent to the backend.
         *
         * The backend has a UNIQUE index on
         * ClientSaleId, so retrying the same
         * sale cannot create a duplicate sale.
         */
        const payload = {
            clientSaleId:
                sale.localSaleId,

            userId:
                sale.userId,

            paymentMethod:
                sale.paymentMethod,

            amountPaid:
                sale.amountPaid,

            customerName:
                sale.customerName ??
                undefined,

            items: items.map((item) => ({
                productId:
                    item.productId,

                quantity:
                    item.quantity,
            })),
        };

        console.log(
            `🔄 Syncing sale ${sale.localSaleId}...`
        );

        const response =
            await api.post<{
                saleId: number;
                message: string;
            }>(
                "/Sales",
                payload
            );

        const serverSaleId =
            response.data.saleId;

        await markSaleSynced(
            sale.localSaleId,
            serverSaleId
        );

        return {
            localSaleId:
                sale.localSaleId,

            success: true,

            serverSaleId,
        };
       } catch (error: any) {
        const status =
            error?.response?.status;

        const message =
            error?.response?.data?.message ||
            error?.response?.data ||
            error?.message ||
            "Unknown synchronization error.";

        /*
         * 4xx responses are permanent business/request
         * failures. Do not keep retrying them.
         *
         * The local sale already deducted cached stock,
         * so rejectedLocalSale() restores that stock.
         */
        if (
            status &&
            status >= 400 &&
            status < 500
        ) {
            await rejectLocalSale(
                sale.localSaleId,
                String(message)
            );
        } else {
            /*
             * Network errors and server errors remain
             * retryable. Keep the local stock deducted
             * because the sale may still be synchronized.
             */
            await markSyncFailed(
                sale.localSaleId,
                String(message)
            );
        }

        return {
            localSaleId:
                sale.localSaleId,

            success: false,

            error: String(message),
        };
    }
}

/**
 * Synchronize all pending offline sales.
 *
 * Returns a result for every sale that was attempted.
 */
export async function syncPendingSales(): Promise<
    SyncResult[]
> {
    const pendingSales =
        await getPendingSales();

    if (pendingSales.length === 0) {
        console.log(
            "✅ No pending sales to synchronize."
        );

        return [];
    }

    console.log(
        `🔄 Found ${pendingSales.length} pending sale(s) to synchronize.`
    );

    const results: SyncResult[] = [];

    /*
     * Process sales sequentially.
     *
     * This is intentional for a POS system.
     * We don't want several offline sales
     * modifying server stock simultaneously
     * from one device.
     */
    for (const sale of pendingSales) {
        const result =
            await syncOneSale(sale);

        results.push(result);

        /*
         * If the server/network is unavailable,
         * stop immediately.
         *
         * The remaining sales stay in SQLite
         * and will be attempted later.
         */
        if (!result.success) {
            console.warn(
                "⚠️ Sale synchronization stopped after an error."
            );

            break;
        }
    }

    const successful =
        results.filter(
            (result) => result.success
        ).length;

    console.log(
        `📊 Sync finished: ${successful}/${results.length} sale(s) synchronized.`
    );

    return results;
}

/**
 * Get the number of sales still waiting to sync.
 */
export async function getPendingSaleCount(): Promise<number> {
    const db = await getDatabase();

    const result =
        await db.getFirstAsync<{
            count: number;
        }>(
            `
            SELECT COUNT(*) AS count
            FROM sync_queue
            WHERE status IN ('pending', 'failed')
            `
        );

    return Number(result?.count ?? 0);
}