namespace bluepeak_api.DTOs.Sales;

public class SaleReceiptItemDto
{
    public string ProductName { get; set; } = "";

    public int Quantity { get; set; }

    // SingleUnit or Pack.
    public string SaleUnitType { get; set; } = "SingleUnit";

    // Pack size at the time of sale.
    public int UnitsPerPackAtSale { get; set; } = 1;

    // Actual individual units deducted from stock.
    public int StockQuantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal Total { get; set; }
}