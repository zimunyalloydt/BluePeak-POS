namespace bluepeak_api.DTOs.Refunds;

public class RefundHistoryDto
{
    public int RefundId { get; set; }

    public int RefundRequestId { get; set; }

    public int SaleId { get; set; }

    public string Cashier { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public string Reason { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public DateTime RequestedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public string? ProcessedBy { get; set; }
}