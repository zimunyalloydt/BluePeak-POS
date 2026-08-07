namespace bluepeak_api.DTOs.Sales;

public class SaleHistoryDto
{
    public int SaleId { get; set; }

    public DateTime SaleDate { get; set; }

    public string PaymentMethod { get; set; } = "";

    public decimal Total { get; set; }

    public int ItemCount { get; set; }

    public string Status { get; set; } = "Completed";
}