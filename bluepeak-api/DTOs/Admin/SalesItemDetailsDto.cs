namespace bluepeak_api.DTOs.Admin;

public class SaleItemDetailsDto

{

    public int SaleItemId { get; set; }

    public int ProductId { get; set; }

    public string ProductName { get; set; } = "";

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal CostPrice { get; set; }

    public decimal Total { get; set; }

    public decimal Profit { get; set; }

}