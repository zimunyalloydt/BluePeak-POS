using bluepeak_api.Models;

namespace bluepeak_api.Interfaces;

public interface IRefundRepository
{
    Task AddAsync(RefundRequest request);

    Task<List<RefundRequest>> GetPendingAsync();

    Task<RefundRequest?> GetByIdAsync(int id);

    Task SaveChangesAsync();
}