using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace bluepeak_api.Models;

public class Refund
{
    [Key]
    public int RefundId { get; set; }

    public int RefundRequestId { get; set; }

    public RefundRequest? RefundRequest { get; set; }

    public int SaleId { get; set; }

    public Sale? Sale { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    public int ProcessedByUserId { get; set; }

    public User? ProcessedByUser { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<RefundItem> Items { get; set; }
        = new List<RefundItem>();
}
