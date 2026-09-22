using bluepeak_api.Data;
using bluepeak_api.DTOs.Refunds;
using bluepeak_api.Interfaces;
using bluepeak_api.Models;
using Microsoft.EntityFrameworkCore;

namespace bluepeak_api.Services;

public class RefundService : IRefundService
{
    private readonly AppDbContext _context;
    private readonly IRefundRepository _repository;

    public RefundService(
        AppDbContext context,
        IRefundRepository repository)
    {
        _context = context;
        _repository = repository;
    }

    public async Task CreateRequestAsync(
        int userId,
        CreateRefundRequestDto dto)
    {
        var sale = await _context.Sales
            .Include(s => s.Items)
            .FirstOrDefaultAsync(s =>
                s.SaleId == dto.SaleId);

        if (sale == null)
            throw new Exception("Sale not found.");

        // Only the cashier who made the sale
        // can request its refund.
        if (sale.UserId != userId)
            throw new UnauthorizedAccessException(
                "You can only request refunds for your own sales.");

        // Don't allow another pending/approved refund
        // for the same sale.
        var existingRefund =
            await _context.RefundRequests
                .AnyAsync(r =>
                    r.SaleId == dto.SaleId &&
                    (r.Status == "Pending" ||
                     r.Status == "Approved"));

        if (existingRefund)
            throw new Exception(
                "A refund request already exists for this sale.");

        if (string.IsNullOrWhiteSpace(dto.Reason))
            throw new Exception(
                "A refund reason is required.");

        var request = new RefundRequest
        {
            SaleId = sale.SaleId,
            RequestedByUserId = userId,
            Reason = dto.Reason.Trim(),
            Notes = dto.Notes,
            Status = "Pending",
            RequestedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(request);
        await _repository.SaveChangesAsync();
    }

    public async Task<List<RefundRequestDto>> GetPendingAsync()
    {
        var requests =
            await _repository.GetPendingAsync();

        return requests.Select(r => new RefundRequestDto
        {
            RefundRequestId = r.RefundRequestId,
            SaleId = r.SaleId,
            Cashier =
                $"{r.RequestedByUser?.FirstName} {r.RequestedByUser?.LastName}",
            Reason = r.Reason,
            Status = r.Status,
            RequestedAt = r.RequestedAt
        }).ToList();
    }

    public async Task ApproveAsync(
        int refundId,
        int adminUserId)
    {
        var request =
            await _repository.GetByIdAsync(refundId);

        if (request == null)
            throw new Exception(
                "Refund request not found.");

        if (request.Status != "Pending")
            throw new Exception(
                "Only pending refund requests can be approved.");

        request.Status = "Approved";
        request.ApprovedByUserId = adminUserId;
        request.ApprovedAt = DateTime.UtcNow;

        await _repository.SaveChangesAsync();
    }

    public async Task RejectAsync(
        int refundId,
        int adminUserId)
    {
        var request =
            await _repository.GetByIdAsync(refundId);

        if (request == null)
            throw new Exception(
                "Refund request not found.");

        if (request.Status != "Pending")
            throw new Exception(
                "Only pending refund requests can be rejected.");

        request.Status = "Rejected";
        request.ApprovedByUserId = adminUserId;
        request.ApprovedAt = DateTime.UtcNow;

        await _repository.SaveChangesAsync();
    }
}