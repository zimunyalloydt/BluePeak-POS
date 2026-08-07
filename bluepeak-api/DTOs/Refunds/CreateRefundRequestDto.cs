namespace bluepeak_api.DTOs.Refunds;

public class CreateRefundRequestDto
{
    public int SaleId { get; set; }

    public string Reason { get; set; } = string.Empty;

    public string? Notes { get; set; }
}