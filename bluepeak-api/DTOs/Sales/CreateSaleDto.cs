namespace bluepeak_api.DTOs.Sales;

public class CreateSaleDto
{
    public string ClientSaleId { get; set; } = string.Empty;

    public int UserId { get; set; }

    public string PaymentMethod { get; set; } = "Cash";

    public decimal AmountPaid { get; set; }

    public string? CustomerName { get; set; }

    public List<CreateSaleItemDto> Items { get; set; } = new();
}