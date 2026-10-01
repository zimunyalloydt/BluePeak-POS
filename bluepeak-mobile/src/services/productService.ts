import api from "./api";
import {
    getLocalProducts,
    saveProductsLocally,
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

        const products = Array.isArray(response.data)
            ? response.data
            : [];

        if (products.length > 0) {
            await saveProductsLocally(products);
        }

        return products;
    } catch (error) {
        console.warn(
            "⚠️ Server unavailable. Loading cached products."
        );

        const localProducts = await getLocalProducts();

        if (localProducts.length === 0) {
            throw new Error(
                "No internet connection and no products are cached on this device."
            );
        }

        console.log(
            `📦 Loaded ${localProducts.length} products from local database`
        );

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