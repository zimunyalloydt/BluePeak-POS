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
    private readonly IOrganisationContext _organisationContext;

    public RefundService(
        AppDbContext context,
        IRefundRepository repository,
        IOrganisationContext organisationContext)
    {
        _context = context;
        _repository = repository;
        _organisationContext = organisationContext;
    }

    private int OrganisationId => _organisationContext.OrganisationId;

    private async Task<User> ValidateAdminAsync(int adminUserId)
    {
        var admin = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u =>
                u.UserId == adminUserId &&
                u.OrganisationId == OrganisationId &&
                u.IsActive);

        if (admin == null)
            throw new UnauthorizedAccessException(
                "Administrator not found in your organisation.");

        if (admin.Role?.RoleName != "Admin")
            throw new UnauthorizedAccessException(
                "Only an administrator can process refund requests.");

        return admin;
    }

    public async Task CreateRequestAsync(
        int userId,
        CreateRefundRequestDto dto)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u =>
                u.UserId == userId &&
                u.OrganisationId == OrganisationId &&
                u.IsActive);

        if (user == null)
            throw new UnauthorizedAccessException(
                "Your account is inactive or does not belong to this organisation.");

        if (string.IsNullOrWhiteSpace(dto.Reason))
            throw new ArgumentException(
                "A refund reason is required.");

        var sale = await _context.Sales
            .Include(s => s.Items)
            .FirstOrDefaultAsync(s =>
                s.SaleId == dto.SaleId &&
                s.OrganisationId == OrganisationId);

        if (sale == null)
            throw new KeyNotFoundException(
                "Sale not found in your organisation.");

        if (sale.UserId != userId)
            throw new UnauthorizedAccessException(
                "You can only request refunds for your own sales.");

        var existingRefund = await _context.RefundRequests
            .AnyAsync(r =>
                r.SaleId == sale.SaleId &&
                (r.Status == "Pending" ||
                 r.Status == "Approved" ||
                 r.Status == "Completed"));

        if (existingRefund)
            throw new InvalidOperationException(
                "A refund request already exists for this sale.");

        var alreadyRefunded = await _context.Refunds
            .AnyAsync(r => r.SaleId == sale.SaleId);

        if (alreadyRefunded)
            throw new InvalidOperationException(
                "This sale has already been refunded.");

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
        var requests = await _repository.GetPendingAsync();

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
        await ValidateAdminAsync(adminUserId);

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        try
        {
            var request = await _context.RefundRequests
                .Include(r => r.Sale)
                    .ThenInclude(s => s!.Items)
                        .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(r =>
                    r.RefundRequestId == refundId &&
                    r.Sale != null &&
                    r.Sale.OrganisationId == OrganisationId);

            if (request == null)
                throw new KeyNotFoundException(
                    "Refund request not found in your organisation.");

            if (request.Status != "Pending")
                throw new InvalidOperationException(
                    "Only pending refund requests can be approved.");

            var sale = request.Sale!;

            if (sale.Items == null || !sale.Items.Any())
                throw new InvalidOperationException(
                    "The sale contains no items to refund.");

            var alreadyRefunded = await _context.Refunds
                .AnyAsync(r => r.SaleId == sale.SaleId);

            if (alreadyRefunded)
                throw new InvalidOperationException(
                    "This sale has already been refunded.");

            if (sale.Total <= 0)
                throw new InvalidOperationException(
                    "The sale has an invalid refund amount.");

            foreach (var saleItem in sale.Items)
            {
                if (saleItem.Quantity <= 0)
                    throw new InvalidOperationException(
                        $"Invalid quantity for sale item {saleItem.SaleItemId}.");

                var product = saleItem.Product;

                if (product == null ||
                    product.OrganisationId != OrganisationId)
                {
                    throw new InvalidOperationException(
                        $"Product for sale item {saleItem.SaleItemId} does not belong to your organisation or could not be found.");
                }
            }

            var now = DateTime.UtcNow;

            var refund = new Refund
            {
                RefundRequestId = request.RefundRequestId,
                SaleId = sale.SaleId,
                Amount = sale.Total,
                ProcessedByUserId = adminUserId,
                CreatedAt = now
            };

            await _context.Refunds.AddAsync(refund);

            foreach (var saleItem in sale.Items)
            {
                var product = saleItem.Product!;

                product.QuantityInStock += saleItem.Quantity;

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

            request.Status = "Completed";
            request.ApprovedByUserId = adminUserId;
            request.ApprovedAt = now;
            request.CompletedAt = now;

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

        var refund = await _context.Refunds
            .Where(r =>
                r.RefundRequestId == refundRequestId &&
                r.Sale != null &&
                r.Sale.OrganisationId == OrganisationId)
            .Include(r => r.Items)
            .FirstOrDefaultAsync();

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
        var refunds = await _repository.GetHistoryAsync();

        return refunds.Select(r => new RefundHistoryDto
        {
            RefundId = r.RefundId,
            RefundRequestId = r.RefundRequestId,
            SaleId = r.SaleId,
            Cashier =
                $"{r.RefundRequest?.RequestedByUser?.FirstName} " +
                $"{r.RefundRequest?.RequestedByUser?.LastName}".Trim(),
            Amount = r.Amount,
            Reason = r.RefundRequest?.Reason ?? string.Empty,
            Status = r.RefundRequest?.Status ?? "Completed",
            RequestedAt =
                r.RefundRequest?.RequestedAt ?? r.CreatedAt,
            CompletedAt = r.RefundRequest?.CompletedAt,
            ProcessedBy =
                $"{r.ProcessedByUser?.FirstName} " +
                $"{r.ProcessedByUser?.LastName}".Trim()
        }).ToList();
    }

    public async Task<RefundRequestDto?> GetBySaleIdAsync(
        int saleId,
        int userId)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u =>
                u.UserId == userId &&
                u.OrganisationId == OrganisationId &&
                u.IsActive);

        if (user == null)
            throw new UnauthorizedAccessException(
                "Your account is inactive or does not belong to this organisation.");

        var request = await _repository.GetBySaleIdAsync(saleId);

        if (request == null)
            return null;

        if (request.Sale == null ||
            request.Sale.OrganisationId != OrganisationId)
        {
            return null;
        }

        if (request.Sale.UserId != userId)
            throw new UnauthorizedAccessException(
                "You are not authorized to view this refund request.");

        return new RefundRequestDto
        {
            RefundRequestId = request.RefundRequestId,
            SaleId = request.SaleId,
            Cashier =
                $"{request.RequestedByUser?.FirstName} " +
                $"{request.RequestedByUser?.LastName}".Trim(),
            Reason = request.Reason,
            Status = request.Status,
            RequestedAt = request.RequestedAt
        };
    }

    public async Task RejectAsync(
        int refundId,
        int adminUserId)
    {
        await ValidateAdminAsync(adminUserId);

        var request = await _repository.GetByIdAsync(refundId);

        if (request == null)
            throw new KeyNotFoundException(
                "Refund request not found in your organisation.");

        if (request.Status != "Pending")
            throw new InvalidOperationException(
                "Only pending refund requests can be rejected.");

        request.Status = "Rejected";
        request.ApprovedByUserId = adminUserId;
        request.ApprovedAt = DateTime.UtcNow;

        await _repository.SaveChangesAsync();
    }
}
