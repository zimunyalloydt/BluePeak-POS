using bluepeak_api.DTOs.Sales;

namespace bluepeak_api.Interfaces;

public interface ISaleService
{
    Task<int> ProcessSaleAsync(CreateSaleDto dto, int userId);

    Task<List<SaleHistoryDto>> GetMySalesAsync(int userId);

    Task<SaleReceiptDto?> GetReceiptAsync(int saleId);
}