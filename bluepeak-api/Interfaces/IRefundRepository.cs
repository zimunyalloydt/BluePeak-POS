using bluepeak_api.Models;

namespace bluepeak_api.Interfaces;

public interface IRefundRepository
{
    Task AddAsync(RefundRequest request);

    Task<List<RefundRequest>> GetPendingAsync();

    Task<RefundRequest?> GetByIdAsync(int id);
    Task<RefundRequest?> GetDetailsAsync(int id);

Task<RefundRequest?> GetBySaleIdAsync(int saleId);
Task<List<Refund>> GetHistoryAsync();

    Task SaveChangesAsync();
}