import api from "./api";

export type CreateRefundRequest = {
    saleId: number;
    reason: string;
    notes?: string;
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