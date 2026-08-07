namespace bluepeak_api.DTOs.Products;

public class ProductDto
{
    public int ProductId { get; set; }

    public string ProductCode { get; set; } = string.Empty;

    public string ProductName { get; set; } = string.Empty;

    public string? Barcode { get; set; }

    public decimal SellingPrice { get; set; }

    public decimal CostPrice { get; set; }

    public decimal Profit { get; set; }

    public int QuantityInStock { get; set; }

   

    public bool IsActive { get; set; }

  

    public string? ImageUrl { get; set; }
}