using bluepeak_api.Data;
using bluepeak_api.Interfaces;
using bluepeak_api.Models;
using Microsoft.EntityFrameworkCore;

namespace bluepeak_api.Repositories;

public class RefundRepository : IRefundRepository
{
    private readonly AppDbContext _context;
    private readonly IOrganisationContext _organisationContext;

    public RefundRepository(
        AppDbContext context,
        IOrganisationContext organisationContext)
    {
        _context = context;
        _organisationContext = organisationContext;
    }

    private int OrganisationId => _organisationContext.OrganisationId;

    public async Task AddAsync(RefundRequest request)
    {
        var saleBelongsToOrganisation = await _context.Sales
            .AnyAsync(s =>
                s.SaleId == request.SaleId &&
                s.OrganisationId == OrganisationId);

        if (!saleBelongsToOrganisation)
            throw new KeyNotFoundException(
                "Sale not found in your organisation.");

        await _context.RefundRequests.AddAsync(request);
    }

    public async Task<List<RefundRequest>> GetPendingAsync()
    {
        return await _context.RefundRequests
            .Where(r =>
                r.Sale != null &&
                r.Sale.OrganisationId == OrganisationId &&
                r.Status == "Pending")
            .Include(r => r.Sale)
                .ThenInclude(s => s!.User)
            .Include(r => r.RequestedByUser)
            .OrderByDescending(r => r.RequestedAt)
            .ToListAsync();
    }

    public async Task<RefundRequest?> GetByIdAsync(int id)
    {
        return await _context.RefundRequests
            .Where(r =>
                r.RefundRequestId == id &&
                r.Sale != null &&
                r.Sale.OrganisationId == OrganisationId)
            .Include(r => r.Sale)
                .ThenInclude(s => s!.Items)
                    .ThenInclude(i => i.Product)
            .Include(r => r.Sale)
                .ThenInclude(s => s!.User)
            .Include(r => r.RequestedByUser)
            .Include(r => r.ApprovedByUser)
            .FirstOrDefaultAsync();
    }

    public async Task<RefundRequest?> GetDetailsAsync(int id)
    {
        return await _context.RefundRequests
            .Where(r =>
                r.RefundRequestId == id &&
                r.Sale != null &&
                r.Sale.OrganisationId == OrganisationId)
            .Include(r => r.Sale)
                .ThenInclude(s => s!.Items)
                    .ThenInclude(i => i.Product)
            .Include(r => r.RequestedByUser)
            .Include(r => r.ApprovedByUser)
            .FirstOrDefaultAsync();
    }

    public async Task<List<Refund>> GetHistoryAsync()
    {
        return await _context.Refunds
            .Where(r =>
                r.Sale != null &&
                r.Sale.OrganisationId == OrganisationId)
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
            .Where(r =>
                r.SaleId == saleId &&
                r.Sale != null &&
                r.Sale.OrganisationId == OrganisationId)
            .Include(r => r.Sale)
            .Include(r => r.RequestedByUser)
            .FirstOrDefaultAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
