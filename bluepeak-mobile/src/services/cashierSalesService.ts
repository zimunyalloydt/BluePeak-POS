import api from "./api";

export type SaleHistory = {
    saleId: number;
    saleDate: string;
    paymentMethod: string;
    total: number;
    itemCount: number;
    status: string;
};

export type SaleReceiptItem = {
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
};

export type SaleReceipt = {
    saleId: number;
    saleDate: string;
    cashier: string;
    paymentMethod: string;
    subtotal: number;
    vat: number;
    total: number;
    amountPaid: number;
    changeGiven: number;
    items: SaleReceiptItem[];
};

export async function getMySales(): Promise<SaleHistory[]> {
    const { data } = await api.get("/Sales/my-sales");

    return Array.isArray(data) ? data : [];
}

export async function getSaleReceipt(
    saleId: number
): Promise<SaleReceipt> {
    const { data } = await api.get(
        `/Sales/${saleId}`
    );

    return data;
}