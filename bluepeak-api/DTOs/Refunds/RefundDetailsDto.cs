namespace bluepeak_api.DTOs.Refunds;

public class RefundDetailsDto
{
    public int RefundRequestId { get; set; }

    public int RefundId { get; set; }

    public int SaleId { get; set; }

    public string Cashier { get; set; } = string.Empty;

    public string Reason { get; set; } = string.Empty;

    public string? Notes { get; set; }

    public string Status { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public string PaymentMethod { get; set; } = string.Empty;

    public DateTime RequestedAt { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public string? ProcessedBy { get; set; }

    public List<RefundItemDto> Items { get; set; } = new();
}

public class RefundItemDto
{
    public int SaleItemId { get; set; }

    public int ProductId { get; set; }

    public string ProductName { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal Total { get; set; }
}
