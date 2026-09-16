import api from "./api";

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
    const response = await api.get<Product[]>("/Product");

    return response.data;
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