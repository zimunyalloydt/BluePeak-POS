namespace bluepeak_api.DTOs.Sales;

public class CreateSaleItemDto
{
    public int ProductId { get; set; }

    // Number of packs or individual units being sold.
    public int Quantity { get; set; }

    // SingleUnit or Pack.
    // Defaults to SingleUnit for older mobile clients.
    public string SaleUnitType { get; set; } = "SingleUnit";
}