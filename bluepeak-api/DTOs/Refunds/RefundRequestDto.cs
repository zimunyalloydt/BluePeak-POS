namespace bluepeak_api.DTOs.Refunds;

public class RefundRequestDto
{
    public int RefundRequestId { get; set; }

    public int SaleId { get; set; }

    public string Cashier { get; set; } = string.Empty;

    public string Reason { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public DateTime RequestedAt { get; set; }
}