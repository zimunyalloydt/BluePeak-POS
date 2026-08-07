namespace bluepeak_api.DTOs.Sales;

public class SaleReceiptDto
{
    public int SaleId { get; set; }

    public DateTime SaleDate { get; set; }

    public string Cashier { get; set; } = "";

    public string PaymentMethod { get; set; } = "";

    public decimal Subtotal { get; set; }

    public decimal Vat { get; set; }

    public decimal Total { get; set; }

    public decimal AmountPaid { get; set; }

    public decimal ChangeGiven { get; set; }

    public List<SaleReceiptItemDto> Items { get; set; } = new();
}