using System.ComponentModel.DataAnnotations;

namespace bluepeak_api.Models;

public class SaleItem
{
    [Key]
    public int SaleItemId { get; set; }

    public int SaleId { get; set; }

    public Sale? Sale { get; set; }

    public int ProductId { get; set; }

    public Product? Product { get; set; }

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal Total { get; set; }
}