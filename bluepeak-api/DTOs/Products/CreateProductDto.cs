using System.ComponentModel.DataAnnotations;

namespace bluepeak_api.DTOs.Products;

public class CreateProductDto
{
    [Required]
    public string ProductCode { get; set; } = "";

    [Required]
    public string ProductName { get; set; } = "";

    public string? Barcode { get; set; }

    public decimal SellingPrice { get; set; }

// Optional selling price for one complete pack.
public decimal? SellingPricePerPack { get; set; }
    // Optional
    public decimal? CostPrice { get; set; }

    // SingleUnit or Pack
    public string StockType { get; set; } = "SingleUnit";

    // Number of units inside one pack
    public int UnitsPerPack { get; set; } = 1;

    // Used when StockType is SingleUnit
    public int QuantityInStock { get; set; } = 0;

    // Used when StockType is Pack
    public int? PackQuantity { get; set; }

    public bool IsActive { get; set; } = true;

    public IFormFile? Image { get; set; }
}