import api from "./api";
import {
    getLocalProducts,
    saveProductsLocally,
    syncProductsFromServer,
} from "./localDatabase";

export interface Product {
    productId: number;
    productCode: string;
    productName: string;
    barcode?: string;
    sellingPrice: number;
    costPrice: number;
    profit: number;
    quantityInStock?: number;
    isActive?: boolean;
    imageUrl?: string | null;
}

export async function getProducts(): Promise<Product[]> {
    try {
        const response = await api.get<Product[]>("/Product");

        if (!Array.isArray(response.data)) {
            throw new Error("Invalid products response from server.");
        }

        // Synchronise SQLite with the main database,
        // including when the server returns zero products.
        await syncProductsFromServer(response.data);

        return await getLocalProducts();
    } catch (error) {
        console.warn(
            "⚠️ Could not synchronise products. Using local cache.",
            error
        );

        // Keep cached products available when offline.
        const localProducts = await getLocalProducts();

        if (localProducts.length === 0) {
            throw new Error(
                "No internet connection and no products are cached on this device."
            );
        }

        return localProducts;
    }
}

export async function searchProducts(
    query: string
): Promise<Product[]> {
    const response = await api.get<Product[]>(
        "/Product/search",
        {
            params: {
                q: query,
            },
        }
    );

    return response.data;
}

export async function getProduct(
    productId: number
): Promise<Product> {
    const response = await api.get<Product>(
        `/Product/${productId}`
    );

    return response.data;
}

export async function addStock(
    productId: number,
    quantity: number,
    reason?: string
): Promise<Product> {
    const response = await api.post<Product>(
        `/Product/${productId}/stock/add`,
        {
            quantity,
            reason,
        }
    );

    return response.data;
}

export async function removeStock(
    productId: number,
    quantity: number,
    reason?: string
): Promise<Product> {
    const response = await api.post<Product>(
        `/Product/${productId}/stock/remove`,
        {
            quantity,
            reason,
        }
    );

    return response.data;
}