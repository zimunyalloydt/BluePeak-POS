using System.ComponentModel.DataAnnotations;

namespace bluepeak_api.DTOs.Products;

public class UpdateProductDto
{
    [Required]
    public string ProductName { get; set; } = string.Empty;

    public string? Barcode { get; set; }

    public decimal SellingPrice { get; set; }

// Optional separate selling price for one complete pack.
public decimal? SellingPricePerPack { get; set; }
    // Optional
    public decimal? CostPrice { get; set; }

    // Nullable to preserve existing settings
    // when older mobile clients update products.
    public string? StockType { get; set; }

    public int? UnitsPerPack { get; set; }

    public int QuantityInStock { get; set; }

    public bool IsActive { get; set; }

    public string? ImageUrl { get; set; }

    public IFormFile? Image { get; set; }
}