using System.ComponentModel.DataAnnotations;

namespace bluepeak_api.Models;

public class RefundRequest
{
    [Key]
    public int RefundRequestId { get; set; }

    public int SaleId { get; set; }

    public Sale? Sale { get; set; }

    public int RequestedByUserId { get; set; }

    public User? RequestedByUser { get; set; }

    public int? ApprovedByUserId { get; set; }

    public User? ApprovedByUser { get; set; }

    [Required]
    [MaxLength(500)]
    public string Reason { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Notes { get; set; }

    [Required]
    public string Status { get; set; } = "Pending";

    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ApprovedAt { get; set; }

    public DateTime? CompletedAt { get; set; }
}