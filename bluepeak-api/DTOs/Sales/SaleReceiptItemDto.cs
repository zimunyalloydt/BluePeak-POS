namespace bluepeak_api.DTOs.Sales;

public class SaleReceiptItemDto
{
    public string ProductName { get; set; } = "";

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal Total { get; set; }
}