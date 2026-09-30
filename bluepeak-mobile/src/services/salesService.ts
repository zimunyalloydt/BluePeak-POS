import api from "./api";

export interface SaleItem {
    productId: number;
    quantity: number;
}

export interface CreateSaleRequest {
    userId: number;
    paymentMethod: string;
    amountPaid: number;
    customerName?: string;
    items: SaleItem[];
}

export interface CreateSaleResponse {
    saleId: number;
    message: string;
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

export async function createSale(
    sale: CreateSaleRequest
): Promise<CreateSaleResponse> {
    const response = await api.post<CreateSaleResponse>(
        "/Sales",
        sale
    );

    return response.data;
}

export async function getMySales() {
    const response = await api.get("/Sales/my-sales");

    return response.data;
}

export async function getReceipt(
    saleId: number
): Promise<Receipt> {
    const response = await api.get<Receipt>(
        `/Sales/${saleId}`
    );

    return response.data;
}