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

    public SaleService(
        AppDbContext context,
        ISaleRepository repository)
    {
        _context = context;
        _repository = repository;
    }

    public async Task<int> ProcessSaleAsync(CreateSaleDto dto, int userId)
    {
        bool isAdmin = await _context.Users
            .Include(u => u.Role)
            .AnyAsync(u =>
                u.UserId == userId &&
                u.Role!.RoleName == "Admin");

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

        // Prevent duplicate sales when an offline sale is retried.
        if (string.IsNullOrWhiteSpace(dto.ClientSaleId))
        {
            throw new ArgumentException(
                "ClientSaleId is required.");
        }

        var existingSale = await _context.Sales
            .FirstOrDefaultAsync(s =>
                s.ClientSaleId == dto.ClientSaleId);

        if (existingSale != null)
        {
            return existingSale.SaleId;
        }

        using var transaction =
            await _context.Database.BeginTransactionAsync();

        decimal subtotal = 0;

        var sale = new Sale
        {
            ClientSaleId = dto.ClientSaleId,
            UserId = userId,
            CustomerName = dto.CustomerName,
            PaymentMethod = dto.PaymentMethod,
            AmountPaid = dto.AmountPaid,
            SaleDate = DateTime.UtcNow
        };

        foreach (var item in dto.Items)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(x =>
                    x.ProductId == item.ProductId);

            if (product == null)
            {
                throw new Exception(
                    $"Product {item.ProductId} not found.");
            }

            /* 
            if (product.QuantityInStock < item.Quantity)
                throw new Exception(
                    $"{product.ProductName} is out of stock.");
            */

            product.QuantityInStock -= item.Quantity;

            decimal total =
                product.SellingPrice * item.Quantity;

            subtotal += total;

            sale.Items.Add(new SaleItem
            {
                ProductId = product.ProductId,
                Quantity = item.Quantity,
                UnitPrice = product.SellingPrice,
                Total = total
            });
        }

        sale.Subtotal = subtotal;
        sale.Vat = subtotal * 0.15m;
        sale.Total = sale.Subtotal + sale.Vat;
        sale.ChangeGiven =
            sale.AmountPaid - sale.Total;

        await _repository.AddSaleAsync(sale);

        await _repository.SaveChangesAsync();

        await transaction.CommitAsync();

        return sale.SaleId;
    }

    public async Task<List<SaleHistoryDto>> GetMySalesAsync(
        int userId)
    {
        return await _context.Sales
            .Where(s => s.UserId == userId)
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
        var sale = await _context.Sales
            .Include(s => s.User)
            .Include(s => s.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(s =>
                s.SaleId == saleId);

        if (sale == null)
            return null;

        return new SaleReceiptDto
        {
            SaleId = sale.SaleId,
            SaleDate = sale.SaleDate,
            Cashier =
                sale.User?.FirstName +
                " " +
                sale.User?.LastName,
            PaymentMethod = sale.PaymentMethod,
            Subtotal = sale.Subtotal,
            Vat = sale.Vat,
            Total = sale.Total,
            AmountPaid = sale.AmountPaid,
            ChangeGiven = sale.ChangeGiven,

            Items = sale.Items.Select(i =>
                new SaleReceiptItemDto
                {
                    ProductName =
                        i.Product!.ProductName,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    Total = i.Total
                }).ToList()
        };
    }
}