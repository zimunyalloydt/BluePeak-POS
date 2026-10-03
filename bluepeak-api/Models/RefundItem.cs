using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace bluepeak_api.Models;

public class RefundItem
{
    [Key]
    public int RefundItemId { get; set; }

    public int RefundId { get; set; }

    public Refund? Refund { get; set; }

    public int SaleItemId { get; set; }

    public SaleItem? SaleItem { get; set; }

    public int ProductId { get; set; }

    public Product? Product { get; set; }

    public int Quantity { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Total { get; set; }
}