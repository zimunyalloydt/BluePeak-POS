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
    await using var transaction =
        await _context.Database.BeginTransactionAsync();

    try
    {
        var request = await _context.RefundRequests
            .Include(r => r.Sale)
                .ThenInclude(s => s!.Items)
                    .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(r =>
                r.RefundRequestId == refundId);

        if (request == null)
            throw new Exception(
                "Refund request not found.");

        if (request.Status != "Pending")
            throw new Exception(
                "Only pending refund requests can be approved.");

        if (request.Sale == null)
            throw new Exception(
                "The sale associated with this refund could not be found.");

        var alreadyRefunded =
            await _context.Refunds
                .AnyAsync(r =>
                    r.SaleId == request.SaleId);

        if (alreadyRefunded)
            throw new Exception(
                "This sale has already been refunded.");

        var sale = request.Sale;

        if (sale.Items == null || !sale.Items.Any())
            throw new Exception(
                "The sale contains no items to refund.");

        // Calculate the full refund amount.
        var refundAmount = sale.Total;

        if (refundAmount <= 0)
            throw new Exception(
                "The sale has an invalid refund amount.");

        // Create the refund record.
        var refund = new Refund
        {
            RefundRequestId = request.RefundRequestId,
            SaleId = sale.SaleId,
            Amount = refundAmount,
            ProcessedByUserId = adminUserId,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Refunds.AddAsync(refund);

        // Restore stock and create refund item records.
        foreach (var saleItem in sale.Items)
        {
            if (saleItem.Product == null)
                throw new Exception(
                    $"Product for sale item {saleItem.SaleItemId} could not be found.");

            if (saleItem.Quantity <= 0)
                throw new Exception(
                    $"Invalid quantity for sale item {saleItem.SaleItemId}.");

            saleItem.Product.QuantityInStock +=
                saleItem.Quantity;

            var refundItem = new RefundItem
            {
                Refund = refund,
                SaleItemId = saleItem.SaleItemId,
                ProductId = saleItem.ProductId,
                Quantity = saleItem.Quantity,
                UnitPrice = saleItem.UnitPrice,
                Total = saleItem.Total
            };

            await _context.RefundItems.AddAsync(refundItem);
        }

        // Mark the refund request as completed.
        request.Status = "Completed";
        request.ApprovedByUserId = adminUserId;
        request.ApprovedAt = DateTime.UtcNow;
        request.CompletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await transaction.CommitAsync();
    }
    catch
    {
        await transaction.RollbackAsync();
        throw;
    }
}

public async Task<RefundDetailsDto?> GetDetailsAsync(
    int refundRequestId)
{
    var request =
        await _repository.GetDetailsAsync(refundRequestId);

    if (request == null)
        return null;

    var refund =
        await _context.Refunds
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r =>
                r.RefundRequestId == refundRequestId);

    var cashier =
        $"{request.RequestedByUser?.FirstName} {request.RequestedByUser?.LastName}"
            .Trim();

    var processedBy =
        $"{request.ApprovedByUser?.FirstName} {request.ApprovedByUser?.LastName}"
            .Trim();

    return new RefundDetailsDto
    {
        RefundRequestId = request.RefundRequestId,
        RefundId = refund?.RefundId ?? 0,
        SaleId = request.SaleId,
        Cashier = cashier,
        Reason = request.Reason,
        Notes = request.Notes,
        Status = request.Status,
        Amount = refund?.Amount ?? request.Sale?.Total ?? 0,
        PaymentMethod = request.Sale?.PaymentMethod ?? string.Empty,
        RequestedAt = request.RequestedAt,
        ApprovedAt = request.ApprovedAt,
        CompletedAt = request.CompletedAt,
        ProcessedBy =
            string.IsNullOrWhiteSpace(processedBy)
                ? null
                : processedBy,

        Items = request.Sale?.Items
            .Select(i => new RefundItemDto
            {
                SaleItemId = i.SaleItemId,
                ProductId = i.ProductId,
                ProductName =
                    i.Product?.ProductName ?? "Unknown Product",
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                Total = i.Total
            })
            .ToList()
            ?? new List<RefundItemDto>()
    };
}

public async Task<List<RefundHistoryDto>> GetHistoryAsync()
{
    var refunds =
        await _repository.GetHistoryAsync();

    return refunds.Select(r => new RefundHistoryDto
    {
        RefundId = r.RefundId,
        RefundRequestId = r.RefundRequestId,
        SaleId = r.SaleId,

        Cashier =
            $"{r.RefundRequest?.RequestedByUser?.FirstName} " +
            $"{r.RefundRequest?.RequestedByUser?.LastName}".Trim(),

        Amount = r.Amount,

        Reason =
            r.RefundRequest?.Reason ?? string.Empty,

        Status =
            r.RefundRequest?.Status ?? "Completed",

        RequestedAt =
            r.RefundRequest?.RequestedAt ?? r.CreatedAt,

        CompletedAt =
            r.RefundRequest?.CompletedAt,

        ProcessedBy =
            $"{r.ProcessedByUser?.FirstName} " +
            $"{r.ProcessedByUser?.LastName}".Trim()
    }).ToList();
}

public async Task<RefundRequestDto?> GetBySaleIdAsync(
    int saleId,
    int userId)
{
    var request =
        await _repository.GetBySaleIdAsync(saleId);

    if (request == null)
        return null;

    if (request.Sale == null)
        return null;

    // A cashier may only view refund requests
    // belonging to their own sale.
    if (request.Sale.UserId != userId)
        throw new UnauthorizedAccessException(
            "You are not authorized to view this refund request."
        );

    var cashier =
        $"{request.RequestedByUser?.FirstName} " +
        $"{request.RequestedByUser?.LastName}"
        .Trim();

    return new RefundRequestDto
    {
        RefundRequestId = request.RefundRequestId,
        SaleId = request.SaleId,
        Cashier = cashier,
        Reason = request.Reason,
        Status = request.Status,
        RequestedAt = request.RequestedAt
    };
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