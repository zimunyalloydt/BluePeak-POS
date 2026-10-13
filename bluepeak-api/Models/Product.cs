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

    [Column(TypeName = "decimal(18,2)")]
    public decimal CostPrice { get; set; }

    // Current physical stock
    [Required]
    public int QuantityInStock { get; set; } = 0;

    // Smart inventory settings
    [Required]
    public int ReorderLevel { get; set; } = 10;

    [Required]
    public int ReorderQuantity { get; set; } = 50;

    [Required]
    public int SupplierLeadTimeDays { get; set; } = 3;

    [NotMapped]
    public decimal Profit => SellingPrice - CostPrice;

    public string? ImageUrl { get; set; }

    public bool IsActive { get; set; } = true;

    [Required]
public int TargetStockDays { get; set; } = 7;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}