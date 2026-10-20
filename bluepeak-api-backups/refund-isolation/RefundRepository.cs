using bluepeak_api.Data;
using bluepeak_api.Interfaces;
using bluepeak_api.Models;
using Microsoft.EntityFrameworkCore;

namespace bluepeak_api.Repositories;

public class RefundRepository : IRefundRepository
{
    private readonly AppDbContext _context;

    public RefundRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(RefundRequest request)
    {
        await _context.RefundRequests.AddAsync(request);
    }

    public async Task<List<RefundRequest>> GetPendingAsync()
    {
        return await _context.RefundRequests
            .Include(r => r.Sale)
                .ThenInclude(s => s!.User)
            .Include(r => r.RequestedByUser)
            .Where(r => r.Status == "Pending")
            .OrderByDescending(r => r.RequestedAt)
            .ToListAsync();
    }

    public async Task<RefundRequest?> GetByIdAsync(int id)
    {
        return await _context.RefundRequests
            .Include(r => r.Sale)
                .ThenInclude(s => s!.Items)
                    .ThenInclude(i => i.Product)
            .Include(r => r.Sale)
                .ThenInclude(s => s!.User)
            .Include(r => r.RequestedByUser)
            .Include(r => r.ApprovedByUser)
            .FirstOrDefaultAsync(r =>
                r.RefundRequestId == id);
    }
    public async Task<RefundRequest?> GetDetailsAsync(int id)
{
    return await _context.RefundRequests
        .Include(r => r.Sale)
            .ThenInclude(s => s!.Items)
                .ThenInclude(i => i.Product)
        .Include(r => r.RequestedByUser)
        .Include(r => r.ApprovedByUser)
        .FirstOrDefaultAsync(r =>
            r.RefundRequestId == id);
}
public async Task<List<Refund>> GetHistoryAsync()
{
    return await _context.Refunds
        .Include(r => r.RefundRequest)
            .ThenInclude(rr => rr!.RequestedByUser)
        .Include(r => r.ProcessedByUser)
        .Include(r => r.Sale)
        .OrderByDescending(r => r.CreatedAt)
        .ToListAsync();
}
public async Task<RefundRequest?> GetBySaleIdAsync(int saleId)
{
    return await _context.RefundRequests
        .Include(r => r.Sale)
        .Include(r => r.RequestedByUser)
        .FirstOrDefaultAsync(r =>
            r.SaleId == saleId);
}

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}