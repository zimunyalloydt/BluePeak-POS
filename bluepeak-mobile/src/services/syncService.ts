import axios from "axios";

import {
    getDatabase,
    getActiveOrganisationId,
    markSaleSynced as markLocalSaleSynced,
    markSaleSyncFailed,
} from "./localDatabase";

import {
    getToken,
    getUser,
} from "../storage/authStorage";

import { API_BASE_URL } from "../config/api";

interface LocalSale {
    localSaleId: string;
    receiptToken: string | null;
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

interface SyncSession {
    organisationId: number;
    userId: number;
    token: string;
}

interface SyncResult {
    localSaleId: string;
    success: boolean;
    serverSaleId?: number;
    error?: string;
}

function isSessionStillActive(
    session: SyncSession
): boolean {
    return (
        getActiveOrganisationId() === session.organisationId
    );
}

async function assertSessionActive(
    session: SyncSession
): Promise<void> {
    if (!isSessionStillActive(session)) {
        throw new Error(
            "The active organisation changed. Synchronisation stopped."
        );
    }

    const [user, token] = await Promise.all([
        getUser(),
        getToken(),
    ]);

    if (
        getActiveOrganisationId() !== session.organisationId ||
        !user ||
        user.organisationId !== session.organisationId ||
        user.userId !== session.userId ||
        token !== session.token
    ) {
        throw new Error(
            "The authenticated session changed. Synchronisation stopped."
        );
    }
}

async function captureSyncSession(): Promise<SyncSession> {
    const organisationId = getActiveOrganisationId();

    const [user, token] = await Promise.all([
        getUser(),
        getToken(),
    ]);

    if (
        !organisationId ||
        !user ||
        user.organisationId !== organisationId ||
        !token
    ) {
        throw new Error(
            "An authenticated online session is required to synchronize sales."
        );
    }

    return {
        organisationId,
        userId: user.userId,
        token,
    };
}

async function getPendingSales(
    session: SyncSession
): Promise<LocalSale[]> {
    await assertSessionActive(session);

    const db = await getDatabase(session.organisationId);

    return db.getAllAsync<LocalSale>(
        `
        SELECT
            s.localSaleId,
            s.receiptToken,
            s.userId,
            s.paymentMethod,
            s.amountPaid,
            s.customerName,
            s.syncStatus
        FROM sales s
        INNER JOIN sync_queue q
            ON q.localSaleId = s.localSaleId
        WHERE
            s.syncStatus IN ('pending', 'failed', 'syncing')
            AND q.status IN ('pending', 'failed', 'syncing')
        ORDER BY s.id ASC
        `
    );
}

async function getSaleItems(
    session: SyncSession,
    localSaleId: string
): Promise<LocalSaleItem[]> {
    await assertSessionActive(session);

    const db = await getDatabase(session.organisationId);

    return db.getAllAsync<LocalSaleItem>(
        `
        SELECT productId, quantity
        FROM sale_items
        WHERE localSaleId = ?
        ORDER BY id ASC
        `,
        localSaleId
    );
}

async function markSyncFailedSafely(
    session: SyncSession,
    localSaleId: string,
    message: string
): Promise<void> {
    try {
        // Always target the database captured for this batch.
        await markSaleSyncFailed(
            localSaleId,
            message,
            session.organisationId
        );
    } catch (error) {
        console.error(
            `Could not update sync status for ${localSaleId}:`,
            error
        );
    }
}

async function syncOneSale(
    session: SyncSession,
    sale: LocalSale
): Promise<SyncResult> {
    try {
        await assertSessionActive(session);

        /*
         * Sales are attributed to the authenticated cashier by the
         * backend. Do not upload a sale created by another cashier
         * using the current cashier's token.
         */
        if (sale.userId !== session.userId) {
            throw new Error(
                "This offline sale belongs to another cashier. Sign in as the original cashier in this organisation to synchronize it."
            );
        }

        const items = await getSaleItems(
            session,
            sale.localSaleId
        );

        await assertSessionActive(session);

        if (items.length === 0) {
            throw new Error(
                "Local sale has no sale items. Manual review is required."
            );
        }

        const payload = {
            clientSaleId: sale.localSaleId,
            userId: sale.userId,
            receiptToken: sale.receiptToken,
            paymentMethod: sale.paymentMethod,
            amountPaid: sale.amountPaid,
            customerName: sale.customerName ?? undefined,
            items: items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
            })),
        };

        console.log(
            `Synchronizing sale ${sale.localSaleId} for organisation ${session.organisationId}.`
        );

        /*
         * Use the captured token explicitly. Do not let the shared
         * Axios interceptor substitute another account's token.
         */
        const response = await axios.post<{
            saleId?: number;
            SaleId?: number;
            message?: string;
            Message?: string;
        }>(
            `${API_BASE_URL}/Sales`,
            payload,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.token}`,
                },
            }
        );

        const serverSaleId =
            response.data.saleId ?? response.data.SaleId;

        if (
            !Number.isInteger(serverSaleId) ||
            !serverSaleId ||
            serverSaleId <= 0
        ) {
            throw new Error(
                "The server response did not contain a valid sale ID."
            );
        }

        /*
         * The request may have completed even if the user switched
         * organisations while the network call was in flight.
         *
         * In that case, do not mutate the currently active database.
         * The original sale remains queued and can be retried; the
         * backend's ClientSaleId idempotency check protects retries.
         */
        /*
         * Revalidate the complete session after the HTTP request.
         * The organisation, cashier and token must all still match
         * the session that uploaded this sale.
         */
        try {
            await assertSessionActive(session);
        } catch (sessionError) {
            console.warn(
                `Sale ${sale.localSaleId} reached the server, but the original session is no longer active. The local sale remains queued for safe reconciliation.`,
                sessionError
            );

            return {
                localSaleId: sale.localSaleId,
                success: false,
                error:
                    "The session changed during upload. The sale remains queued for reconciliation.",
            };
        }

        await markLocalSaleSynced(
            sale.localSaleId,
            serverSaleId,
            session.organisationId
        );

        return {
            localSaleId: sale.localSaleId,
            success: true,
            serverSaleId,
        };
    } catch (error: any) {
        const status = error?.response?.status;

        const responseMessage =
            error?.response?.data?.message ??
            error?.response?.data?.Message;

        const message = String(
            responseMessage ??
            error?.message ??
            "Unknown synchronization error."
        );

        /*
         * Only record a failure if the original session is still
         * active. Logging out, switching organisations or signing
         * in as another cashier must not change the old sale's status.
         */
        try {
            await assertSessionActive(session);

            await markSyncFailedSafely(
                session,
                sale.localSaleId,
                message
            );
        } catch (sessionError) {
            console.warn(
                `Skipped changing the sync status of ${sale.localSaleId} because its original session is no longer active.`,
                sessionError
            );
        }

        if (status === 401 || status === 403) {
            console.warn(
                "Authentication or permission error. Synchronisation must stop."
            );
        }

        return {
            localSaleId: sale.localSaleId,
            success: false,
            error: message,
        };
    }
}

export async function syncPendingSales(): Promise<SyncResult[]> {
    const session = await captureSyncSession();

    await assertSessionActive(session);

    const pendingSales = await getPendingSales(session);

    if (pendingSales.length === 0) {
        console.log("No pending sales to synchronize.");
        return [];
    }

    console.log(
        `Found ${pendingSales.length} sale(s) for organisation ${session.organisationId}.`
    );

    const results: SyncResult[] = [];

    for (const sale of pendingSales) {
        try {
            await assertSessionActive(session);
        } catch (error: any) {
            console.warn(
                "Stopping synchronisation:",
                error?.message ?? error
            );
            break;
        }

        const result = await syncOneSale(session, sale);

        results.push(result);

        if (!result.success) {
            console.warn(
                "Stopping the batch after a synchronisation failure."
            );
            break;
        }
    }

    const successful = results.filter(
        (result) => result.success
    ).length;

    console.log(
        `Sync finished: ${successful}/${results.length} sale(s) synchronized.`
    );

    return results;
}

export async function getPendingSaleCount(): Promise<number> {
    const session = await captureSyncSession();

    await assertSessionActive(session);

    const db = await getDatabase(session.organisationId);

    const result = await db.getFirstAsync<{
        count: number;
    }>(
        `
        SELECT COUNT(*) AS count
        FROM sync_queue
        WHERE status IN ('pending', 'failed', 'syncing')
        `
    );

    return Number(result?.count ?? 0);
}
