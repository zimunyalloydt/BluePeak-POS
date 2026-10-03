import api from "./api";

export type CreateRefundRequest = {
    saleId: number;
    reason: string;
    notes?: string;
};

export type RefundRequestStatus = {
    refundRequestId: number;
    saleId: number;
    reason: string;
    notes?: string | null;
    status: string;
    requestedAt: string;
    approvedAt?: string | null;
    completedAt?: string | null;
};

export type RefundRequest = {
    refundRequestId: number;
    saleId: number;
    cashier: string;
    reason: string;
    status: string;
    requestedAt: string;
};

export type RefundItem = {
    saleItemId: number;
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
};

export type RefundDetails = {
    refundRequestId: number;
    refundId: number;
    saleId: number;
    cashier: string;
    reason: string;
    notes?: string | null;
    status: string;
    amount: number;
    paymentMethod: string;
    requestedAt: string;
    approvedAt?: string | null;
    completedAt?: string | null;
    processedBy?: string | null;
    items: RefundItem[];
};

export type RefundHistory = {
    refundId: number;
    refundRequestId: number;
    saleId: number;
    cashier: string;
    amount: number;
    reason: string;
    status: string;
    requestedAt: string;
    completedAt?: string | null;
    processedBy?: string | null;
};

export async function requestRefund(
    request: CreateRefundRequest
) {
    const { data } = await api.post(
        "/Refunds",
        request
    );

    return data;
}

export async function getRefundStatus(
    saleId: number
): Promise<RefundRequestStatus | null> {
    try {
        const { data } = await api.get(
            `/Refunds/sale/${saleId}`
        );

        return data;
    } catch (error: any) {
        if (error?.response?.status === 404) {
            return null;
        }

        throw error;
    }
}

// ADMIN

export async function getPendingRefunds(): Promise<
    RefundRequest[]
> {
    const { data } = await api.get(
        "/Refunds/pending"
    );

    return Array.isArray(data) ? data : [];
}

export async function getRefundDetails(
    refundRequestId: number
): Promise<RefundDetails> {
    const { data } = await api.get(
        `/Refunds/${refundRequestId}`
    );

    return data;
}

export async function approveRefund(
    refundRequestId: number
) {
    const { data } = await api.put(
        `/Refunds/${refundRequestId}/approve`
    );

    return data;
}

export async function rejectRefund(
    refundRequestId: number
) {
    const { data } = await api.put(
        `/Refunds/${refundRequestId}/reject`
    );

    return data;
}

export async function getRefundHistory(): Promise<
    RefundHistory[]
> {
    const { data } = await api.get(
        "/Refunds/history"
    );

    return Array.isArray(data) ? data : [];
}