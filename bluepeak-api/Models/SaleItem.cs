using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace bluepeak_api.Models;

public class SaleItem
{
    [Key]
    public int SaleItemId { get; set; }

    public int SaleId { get; set; }

    public Sale? Sale { get; set; }

    public int ProductId { get; set; }

    public Product? Product { get; set; }

    // Number of packs or individual units sold.
    public int Quantity { get; set; }

    // Pack or SingleUnit.
    [Required]
    [MaxLength(20)]
    public string SaleUnitType { get; set; } = "SingleUnit";

    // Historical pack configuration.
    public int UnitsPerPackAtSale { get; set; } = 1;

    // Actual individual units deducted from inventory.
    public int StockQuantity { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Total { get; set; }
}