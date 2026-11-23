using bluepeak_api.Data;
using bluepeak_api.DTOs.Sales;
using bluepeak_api.Interfaces;
using bluepeak_api.Models;
using Microsoft.EntityFrameworkCore;

namespace bluepeak_api.Services;

public class SaleService : ISaleService
{
    private readonly AppDbContext _context;
    private readonly ISaleRepository _repository;
    private readonly IOrganisationContext _organisationContext;

    public SaleService(
        AppDbContext context,
        ISaleRepository repository,
        IOrganisationContext organisationContext)
    {
        _context = context;
        _repository = repository;
        _organisationContext = organisationContext;
    }

public async Task<int> ProcessSaleAsync(
    CreateSaleDto dto,
    int userId)
{
    int organisationId = _organisationContext.OrganisationId;

    // Validate cashier.
    var user = await _context.Users
        .Include(u => u.Role)
        .FirstOrDefaultAsync(u =>
            u.UserId == userId &&
            u.OrganisationId == organisationId &&
            u.IsActive);

    if (user == null)
    {
        throw new UnauthorizedAccessException(
            "Your account is inactive or does not belong to this organisation.");
    }

    // Validate selling permission.
    bool isAdmin = user.Role?.RoleName == "Admin";

    if (!isAdmin)
    {
        bool hasPermission = await _context.UserPermissions
            .Include(up => up.Permission)
            .AnyAsync(up =>
                up.UserId == userId &&
                up.Permission.Name == "Sell Products");

        if (!hasPermission)
        {
            throw new UnauthorizedAccessException(
                "You do not have permission to sell products.");
        }
    }

    if (string.IsNullOrWhiteSpace(dto.ClientSaleId))
    {
        throw new ArgumentException("ClientSaleId is required.");
    }

    string clientSaleId = dto.ClientSaleId.Trim();

    if (dto.Items == null || dto.Items.Count == 0)
    {
        throw new ArgumentException(
            "A sale must contain at least one item.");
    }

    var strategy = _context.Database.CreateExecutionStrategy();

    return await strategy.ExecuteAsync(async () =>
    {
        // Ensure each retry starts with a clean change tracker.
        _context.ChangeTracker.Clear();

        // Check duplicate sale inside the execution strategy.
        var existingSale = await _context.Sales
            .FirstOrDefaultAsync(s =>
                s.OrganisationId == organisationId &&
                s.ClientSaleId == clientSaleId);

        if (existingSale != null)
        {
            return existingSale.SaleId;
        }

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        try
        {
            decimal subtotal = 0m;

            var receiptToken = string.IsNullOrWhiteSpace(dto.ReceiptToken)
                ? Guid.NewGuid().ToString("N")
                : dto.ReceiptToken.Trim();

            var sale = new Sale
            {
                ClientSaleId = clientSaleId,
                ReceiptToken = receiptToken,
                OrganisationId = organisationId,
                UserId = userId,
                CustomerName = dto.CustomerName,
                PaymentMethod = dto.PaymentMethod,
                AmountPaid = dto.AmountPaid,
                SaleDate = DateTime.UtcNow
            };

            foreach (var item in dto.Items)
            {
                if (item.Quantity <= 0)
                {
                    throw new ArgumentException(
                        "Sale quantities must be greater than zero.");
                }

                var product = await _context.Products
                    .FirstOrDefaultAsync(p =>
                        p.ProductId == item.ProductId &&
                        p.OrganisationId == organisationId &&
                        p.IsActive);

                if (product == null)
                {
                    throw new InvalidOperationException(
                        $"Product {item.ProductId} was not found, is inactive, " +
                        "or does not belong to your organisation.");
                }

                var saleUnitType = item.SaleUnitType?.Trim();

                if (string.Equals(
                    saleUnitType,
                    "Pack",
                    StringComparison.OrdinalIgnoreCase))
                {
                    saleUnitType = "Pack";
                }
                else if (string.Equals(
                    saleUnitType,
                    "SingleUnit",
                    StringComparison.OrdinalIgnoreCase))
                {
                    saleUnitType = "SingleUnit";
                }
                else
                {
                    throw new ArgumentException(
                        "SaleUnitType must be SingleUnit or Pack.");
                }

                int stockQuantity;
                int unitsPerPackAtSale;
                decimal unitPrice;

                if (saleUnitType == "Pack")
                {
                    if (product.StockType != "Pack")
                    {
                        throw new InvalidOperationException(
                            $"{product.ProductName} is not configured for pack sales.");
                    }

                    if (product.UnitsPerPack <= 0)
                    {
                        throw new InvalidOperationException(
                            $"{product.ProductName} has an invalid pack configuration.");
                    }

                    if (!product.SellingPricePerPack.HasValue ||
                        product.SellingPricePerPack.Value <= 0)
                    {
                        throw new InvalidOperationException(
                            $"{product.ProductName} has an invalid pack selling price.");
                    }

                    stockQuantity = checked(
                        item.Quantity * product.UnitsPerPack);

                    unitsPerPackAtSale = product.UnitsPerPack;

                    unitPrice = product.SellingPricePerPack.Value;
                }
                else
                {
                    stockQuantity = item.Quantity;
                    unitsPerPackAtSale = 1;
                    unitPrice = product.SellingPrice;
                }

                if (product.QuantityInStock < stockQuantity)
                {
                    throw new InvalidOperationException(
                        $"Insufficient stock for {product.ProductName}. " +
                        $"Required: {stockQuantity} individual unit(s). " +
                        $"Available: {product.QuantityInStock}.");
                }

                product.QuantityInStock -= stockQuantity;

                decimal itemTotal = unitPrice * item.Quantity;

                subtotal += itemTotal;

                sale.Items.Add(new SaleItem
                {
                    ProductId = product.ProductId,
                    Quantity = item.Quantity,
                    SaleUnitType = saleUnitType,
                    UnitsPerPackAtSale = unitsPerPackAtSale,
                    StockQuantity = stockQuantity,
                    UnitPrice = unitPrice,
                    Total = itemTotal
                });
            }

            sale.Subtotal = subtotal;
            sale.Vat = 0m;
            sale.Total = subtotal;
            sale.ChangeGiven = sale.AmountPaid - sale.Total;

            await _repository.AddSaleAsync(sale);

            await _repository.SaveChangesAsync();

            await transaction.CommitAsync();

            return sale.SaleId;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    });
}

    public async Task<List<SaleHistoryDto>> GetMySalesAsync(
        int userId)
    {
        int organisationId = _organisationContext.OrganisationId;

        // Do not expose sales outside the current organisation.
        return await _context.Sales
            .Where(s =>
                s.OrganisationId == organisationId &&
                s.UserId == userId)
            .OrderByDescending(s => s.SaleDate)
            .Select(s => new SaleHistoryDto
            {
                SaleId = s.SaleId,
                SaleDate = s.SaleDate,
                PaymentMethod = s.PaymentMethod,
                Total = s.Total,
                ItemCount = s.Items.Count,
                Status = "Completed"
            })
            .ToListAsync();
    }

    public async Task<SaleReceiptDto?> GetReceiptAsync(
        int saleId)
    {
        int organisationId = _organisationContext.OrganisationId;

        // A receipt can only be retrieved within its organisation.
      
      var sale = await _context.Sales
    .Include(s => s.User)
    .Include(s => s.Organisation)
    .Include(s => s.Items)
        .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(s =>
                s.SaleId == saleId &&
                s.OrganisationId == organisationId);

        if (sale == null)
        {
            return null;
        }

        return new SaleReceiptDto
        {
            SaleId = sale.SaleId,
            SaleDate = sale.SaleDate,
            ReceiptToken = sale.ReceiptToken,
            Cashier =
                sale.User?.FirstName +
                " " +
                sale.User?.LastName,
            CustomerName = sale.CustomerName,
            PaymentMethod = sale.PaymentMethod,
            Subtotal = sale.Subtotal,
            Vat = sale.Vat,
            Total = sale.Total,
            AmountPaid = sale.AmountPaid,
            ChangeGiven = sale.ChangeGiven,
            OrganisationName =
    sale.Organisation?.Name ?? string.Empty,

OrganisationAddress =
    sale.Organisation?.Address,

OrganisationPhoneNumber =
    sale.Organisation?.PhoneNumber,

OrganisationEmail =
    sale.Organisation?.Email,

OrganisationLogoUrl =
    sale.Organisation?.LogoUrl,

            Items = sale.Items.Select(i => new SaleReceiptItemDto
            {
                ProductName = i.Product?.ProductName ?? string.Empty,
                Quantity = i.Quantity,
                SaleUnitType = i.SaleUnitType,
                UnitsPerPackAtSale = i.UnitsPerPackAtSale,
                StockQuantity = i.StockQuantity,
                UnitPrice = i.UnitPrice,
                Total = i.Total
            }).ToList()
        };
    }
}