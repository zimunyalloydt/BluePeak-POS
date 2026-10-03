import * as SQLite from "expo-sqlite";

const DB_NAME = "bluepeak.db";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (!dbPromise) {
        dbPromise = SQLite.openDatabaseAsync(DB_NAME);
    }

    return dbPromise;
}

export async function initializeLocalDatabase(): Promise<void> {
    const db = await getDatabase();

    await db.execAsync(`
        PRAGMA journal_mode = WAL;

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY NOT NULL,
            productCode TEXT,
            productName TEXT NOT NULL,
            sellingPrice REAL NOT NULL DEFAULT 0,
            costPrice REAL NOT NULL DEFAULT 0,
            quantityInStock REAL NOT NULL DEFAULT 0,
            imageUrl TEXT,
            isActive INTEGER NOT NULL DEFAULT 1,
            updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            localSaleId TEXT NOT NULL UNIQUE,
            serverSaleId INTEGER,
            userId INTEGER NOT NULL,
            paymentMethod TEXT NOT NULL,
            amountPaid REAL NOT NULL DEFAULT 0,
            customerName TEXT,
            subtotal REAL NOT NULL DEFAULT 0,
            vat REAL NOT NULL DEFAULT 0,
            total REAL NOT NULL DEFAULT 0,
            changeGiven REAL NOT NULL DEFAULT 0,
            profit REAL NOT NULL DEFAULT 0,
            createdAt TEXT NOT NULL,
            syncStatus TEXT NOT NULL DEFAULT 'pending'
        );

        CREATE TABLE IF NOT EXISTS sale_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            localSaleId TEXT NOT NULL,
            productId INTEGER NOT NULL,
            productName TEXT NOT NULL,
            quantity REAL NOT NULL,
            unitPrice REAL NOT NULL,
            costPrice REAL NOT NULL,
            total REAL NOT NULL,
            FOREIGN KEY (localSaleId)
                REFERENCES sales(localSaleId)
                ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS sync_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            localSaleId TEXT NOT NULL UNIQUE,
            status TEXT NOT NULL DEFAULT 'pending',
            attempts INTEGER NOT NULL DEFAULT 0,
            lastAttemptAt TEXT,
            errorMessage TEXT,
            createdAt TEXT NOT NULL,
            FOREIGN KEY (localSaleId)
                REFERENCES sales(localSaleId)
                ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_sales_sync_status
            ON sales(syncStatus);

        CREATE INDEX IF NOT EXISTS idx_sync_queue_status
            ON sync_queue(status);

        CREATE INDEX IF NOT EXISTS idx_sale_items_local_sale
            ON sale_items(localSaleId);
    `);

    // ---------------------------------------------------------
    // DATABASE MIGRATIONS
    // ---------------------------------------------------------

    const salesColumns = await db.getAllAsync<{
        name: string;
    }>(`
        PRAGMA table_info(sales);
    `);

    const hasChangeGiven = salesColumns.some(
        (column) => column.name === "changeGiven"
    );

    if (!hasChangeGiven) {
        await db.execAsync(`
            ALTER TABLE sales
            ADD COLUMN changeGiven REAL NOT NULL DEFAULT 0;
        `);

        console.log(
            "🛠️ Database migration: added sales.changeGiven"
        );
    }

    const saleItemsColumns = await db.getAllAsync<{
        name: string;
    }>(`
        PRAGMA table_info(sale_items);
    `);

    const hasSaleItemTotal = saleItemsColumns.some(
        (column) => column.name === "total"
    );

    if (!hasSaleItemTotal) {
        await db.execAsync(`
            ALTER TABLE sale_items
            ADD COLUMN total REAL NOT NULL DEFAULT 0;
        `);

        console.log(
            "🛠️ Database migration: added sale_items.total"
        );
    }

    console.log("✅ BluePeak local database initialized");
}

export async function saveProductsLocally(
    products: {
        productId: number;
        productCode: string;
        productName: string;
        sellingPrice: number;
        costPrice: number;
        quantityInStock?: number;
        imageUrl?: string | null;
        isActive?: boolean;
    }[]
): Promise<void> {
    const db = await getDatabase();

    await db.withTransactionAsync(async () => {
        for (const product of products) {
            /*
             * Pending/failed local sales have already deducted
             * stock from the phone, but the server may not know
             * about them yet.
             *
             * Therefore, preserve those quantities when
             * refreshing server products.
             */
            const pendingStock = await db.getFirstAsync<{
                reservedQuantity: number;
            }>(
                `
                SELECT
                    COALESCE(SUM(si.quantity), 0)
                    AS reservedQuantity
                FROM sale_items si
                INNER JOIN sync_queue q
                    ON q.localSaleId = si.localSaleId
                WHERE
                    si.productId = ?
                    AND q.status IN ('pending', 'failed')
                `,
                product.productId
            );

            const serverStock =
                product.quantityInStock ?? 0;

            const reservedQuantity =
                Number(
                    pendingStock?.reservedQuantity ?? 0
                );

            const localAvailableStock = Math.max(
                0,
                serverStock - reservedQuantity
            );

            await db.runAsync(
                `
                INSERT INTO products (
                    id,
                    productCode,
                    productName,
                    sellingPrice,
                    costPrice,
                    quantityInStock,
                    imageUrl,
                    isActive,
                    updatedAt
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    productCode = excluded.productCode,
                    productName = excluded.productName,
                    sellingPrice = excluded.sellingPrice,
                    costPrice = excluded.costPrice,
                    quantityInStock =
                        excluded.quantityInStock,
                    imageUrl = excluded.imageUrl,
                    isActive = excluded.isActive,
                    updatedAt = excluded.updatedAt
                `,
                product.productId,
                product.productCode,
                product.productName,
                product.sellingPrice,
                product.costPrice,
                localAvailableStock,
                product.imageUrl ?? null,
                product.isActive === false ? 0 : 1,
                new Date().toISOString()
            );
        }
    });

    console.log(
        `💾 Cached ${products.length} products locally`
    );
}

export async function getLocalProducts() {
    const db = await getDatabase();

    const products = await db.getAllAsync<{
        productId: number;
        productCode: string;
        productName: string;
        sellingPrice: number;
        costPrice: number;
        quantityInStock: number;
        imageUrl: string | null;
        isActive: number;
    }>(
        `
        SELECT
            id AS productId,
            productCode,
            productName,
            sellingPrice,
            costPrice,
            quantityInStock,
            imageUrl,
            isActive
        FROM products
        WHERE isActive = 1
        ORDER BY productName ASC
        `
    );

    return products.map((product) => ({
        ...product,

        // Calculate profit for locally cached products.
        profit:
            Number(product.sellingPrice) -
            Number(product.costPrice),

        isActive: product.isActive === 1,
    }));
}

export async function getLocalSale(
    localSaleId: string
): Promise<LocalSale | null> {
    const db = await getDatabase();

    const sale = await db.getFirstAsync<{
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
        profit: number;
        createdAt: string;
        syncStatus: string;
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
            profit,
            createdAt,
            syncStatus
        FROM sales
        WHERE localSaleId = ?
        LIMIT 1
        `,
        localSaleId
    );

    if (!sale) {
        return null;
    }

    const items = await db.getAllAsync<LocalSaleItem>(
        `
        SELECT
            productId,
            productName,
            quantity,
            unitPrice,
            costPrice,
            total
        FROM sale_items
        WHERE localSaleId = ?
        ORDER BY id ASC
        `,
        localSaleId
    );

    return {
        localSaleId: sale.localSaleId,
        serverSaleId: sale.serverSaleId,
        userId: sale.userId,
        paymentMethod: sale.paymentMethod,
        amountPaid: sale.amountPaid,
        customerName: sale.customerName,
        subtotal: sale.subtotal,
        vat: sale.vat,
        total: sale.total,
        changeGiven: sale.changeGiven,
        profit: sale.profit,
        createdAt: sale.createdAt,
        syncStatus: sale.syncStatus as LocalSale["syncStatus"],
        items,
    };
}

export async function getPendingSales(): Promise<LocalSale[]> {
    const db = await getDatabase();

    const sales = await db.getAllAsync<{
        localSaleId: string;
    }>(
        `
        SELECT localSaleId
        FROM sales
        WHERE syncStatus IN ('pending', 'failed')
        ORDER BY createdAt ASC
        `
    );

    const result: LocalSale[] = [];

    for (const sale of sales) {
        const localSale = await getLocalSale(
            sale.localSaleId
        );

        if (localSale) {
            result.push(localSale);
        }
    }

    return result;
}

export type LocalSaleItem = {
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
    total: number;
};

export type LocalSale = {
    localSaleId: string;
    serverSaleId?: number | null;
    userId: number;
    paymentMethod: string;
    amountPaid: number;
    customerName?: string | null;
    subtotal: number;
    vat: number;
    total: number;
    changeGiven: number;
    profit: number;
    createdAt: string;
    syncStatus: "pending" | "syncing" | "synced" | "failed" | "rejected";
    items: LocalSaleItem[];
};

export type SaveLocalSaleInput = {
    localSaleId: string;
    userId: number;
    paymentMethod: string;
    amountPaid: number;
    customerName?: string | null;
    subtotal: number;
    vat: number;
    total: number;
    changeGiven: number;
    profit: number;
    createdAt: string;
    items: LocalSaleItem[];
};

export async function markSaleSyncing(
    localSaleId: string
): Promise<void> {
    const db = await getDatabase();

    await db.runAsync(
        `
        UPDATE sales
        SET syncStatus = 'syncing'
        WHERE localSaleId = ?
        `,
        localSaleId
    );

    await db.runAsync(
        `
        UPDATE sync_queue
        SET
            status = 'syncing',
            attempts = attempts + 1,
            lastAttemptAt = ?
        WHERE localSaleId = ?
        `,
        new Date().toISOString(),
        localSaleId
    );
}

export async function markSaleSynced(
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
            UPDATE sync_queue
            SET status = 'synced'
            WHERE localSaleId = ?
            `,
            localSaleId
        );
    });

    console.log(
        `☁️ Sale synced: ${localSaleId} → #${serverSaleId}`
    );
}

export async function markSaleSyncFailed(
    localSaleId: string,
    errorMessage: string
): Promise<void> {
    const db = await getDatabase();

    await db.withTransactionAsync(async () => {
        await db.runAsync(
            `
            UPDATE sales
            SET syncStatus = 'failed'
            WHERE localSaleId = ?
            `,
            localSaleId
        );

        await db.runAsync(
            `
            UPDATE sync_queue
            SET
                status = 'failed',
                errorMessage = ?
            WHERE localSaleId = ?
            `,
            errorMessage,
            localSaleId
        );
    });

    console.warn(
        `⚠️ Sale sync failed: ${localSaleId}`,
        errorMessage
    );
}

export async function saveLocalSale(
    sale: SaveLocalSaleInput
): Promise<void> {
    const db = await getDatabase();

    await db.withTransactionAsync(async () => {
        // ---------------------------------------------------------
        // 1. Verify cached stock for every item BEFORE saving sale
        // ---------------------------------------------------------
        for (const item of sale.items) {
            const product = await db.getFirstAsync<{
                quantityInStock: number;
            }>(
                `
                SELECT quantityInStock
                FROM products
                WHERE id = ?
                `,
                item.productId
            );

            const availableStock =
                product?.quantityInStock ?? 0;

            if (availableStock <= 0) {
                throw new Error(
                    `${item.productName} is out of stock.`
                );
            }

            if (availableStock < item.quantity) {
                throw new Error(
                    `Only ${availableStock} unit(s) of ${item.productName} are available.`
                );
            }
        }

        // ---------------------------------------------------------
        // 2. Save the sale
        // ---------------------------------------------------------
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
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
            `,
            sale.localSaleId,
            sale.userId,
            sale.paymentMethod,
            sale.amountPaid,
            sale.customerName ?? null,
            sale.subtotal,
            sale.vat,
            sale.total,
            sale.changeGiven,
            sale.profit,
            sale.createdAt
        );

        // ---------------------------------------------------------
        // 3. Save sale items
        // ---------------------------------------------------------
        for (const item of sale.items) {
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
                sale.localSaleId,
                item.productId,
                item.productName,
                item.quantity,
                item.unitPrice,
                item.costPrice,
                item.total
            );

            // -----------------------------------------------------
            // 4. Deduct stock locally
            // -----------------------------------------------------
            await db.runAsync(
                `
                UPDATE products
                SET quantityInStock = quantityInStock - ?
                WHERE id = ?
                `,
                item.quantity,
                item.productId
            );
        }

        // ---------------------------------------------------------
        // 5. Add sale to sync queue
        // ---------------------------------------------------------
        await db.runAsync(
            `
            INSERT INTO sync_queue (
                localSaleId,
                status,
                attempts,
                createdAt
            )
            VALUES (?, 'pending', 0, ?)
            `,
            sale.localSaleId,
            sale.createdAt
        );
    });

    console.log(
        `💾 Local sale saved and stock deducted: ${sale.localSaleId}`
    );
}

export async function rejectLocalSale(
    localSaleId: string,
    errorMessage: string
): Promise<void> {
    const db = await getDatabase();

    await db.withTransactionAsync(async () => {
        const items = await db.getAllAsync<{
            productId: number;
            quantity: number;
        }>(
            `
            SELECT
                productId,
                quantity
            FROM sale_items
            WHERE localSaleId = ?
            `,
            localSaleId
        );

        // Restore the stock that was deducted when
        // this local sale was originally created.
        for (const item of items) {
            await db.runAsync(
                `
                UPDATE products
                SET quantityInStock =
                    quantityInStock + ?
                WHERE id = ?
                `,
                item.quantity,
                item.productId
            );
        }

        // Keep the sale locally for history/auditing,
        // but mark it as rejected so it cannot be
        // synchronized again.
        await db.runAsync(
            `
            UPDATE sales
            SET syncStatus = 'rejected'
            WHERE localSaleId = ?
            `,
            localSaleId
        );

        await db.runAsync(
            `
            UPDATE sync_queue
            SET
                status = 'rejected',
                errorMessage = ?,
                lastAttemptAt = ?
            WHERE localSaleId = ?
            `,
            errorMessage,
            new Date().toISOString(),
            localSaleId
        );
    });

    console.warn(
        `❌ Local sale rejected: ${localSaleId} — ${errorMessage}`
    );
}