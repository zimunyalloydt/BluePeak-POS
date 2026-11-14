using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace bluepeak_api.Models;

public class Product
{
    [Key]
    public int ProductId { get; set; }

    [Required]
    [MaxLength(30)]
    public string? ProductCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string ProductName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Barcode { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal SellingPrice { get; set; }

// Optional separate selling price for one complete pack.
[Column(TypeName = "decimal(18,2)")]
public decimal? SellingPricePerPack { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? CostPrice { get; set; }

    // SingleUnit or Pack
    [Required]
    [MaxLength(20)]
    public string StockType { get; set; } = "SingleUnit";

    // Number of individual units inside one pack
    [Required]
    public int UnitsPerPack { get; set; } = 1;

    // Always stored as individual units
    [Required]
    public int QuantityInStock { get; set; } = 0;

    [Required]
    public int ReorderLevel { get; set; } = 10;

    [Required]
    public int ReorderQuantity { get; set; } = 50;

    [Required]
    public int SupplierLeadTimeDays { get; set; } = 3;

    [NotMapped]
    public decimal? Profit =>
        CostPrice.HasValue
            ? SellingPrice - CostPrice.Value
            : null;

    public string? ImageUrl { get; set; }

    public bool IsActive { get; set; } = true;

    [Required]
    public int TargetStockDays { get; set; } = 7;

    public int OrganisationId { get; set; }

    public Organisation? Organisation { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}