namespace bluepeak_api.DTOs.Admin;

public class SaleListDto
{
    public int SaleId { get; set; }

    public DateTime SaleDate { get; set; }

    public string Cashier { get; set; } = "";

    public int Items { get; set; }

    public string PaymentMethod { get; set; } = "";

    public decimal Total { get; set; }
}