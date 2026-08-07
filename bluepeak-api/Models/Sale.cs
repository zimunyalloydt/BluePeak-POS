using System.ComponentModel.DataAnnotations;

namespace bluepeak_api.Models;

public class Sale
{
    [Key]
    public int SaleId { get; set; }

    public DateTime SaleDate { get; set; } = DateTime.UtcNow;

    public decimal Subtotal { get; set; }

    public decimal Vat { get; set; }

    public decimal Total { get; set; }

    public string? CustomerName { get; set; }

    public string PaymentMethod { get; set; } = "Cash";

    public decimal AmountPaid { get; set; }

    public decimal ChangeGiven { get; set; }

    public int UserId { get; set; }

    public User? User { get; set; }

    public ICollection<SaleItem> Items { get; set; } = new List<SaleItem>();
}