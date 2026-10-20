using Microsoft.EntityFrameworkCore;
using bluepeak_api.Data;
using bluepeak_api.Interfaces;
using bluepeak_api.Models;

namespace bluepeak_api.Repositories;

public class ProductRepository
    : GenericRepository<Product>, IProductRepository
{
    public ProductRepository(AppDbContext context)
        : base(context)
    {
    }

    public async Task<IEnumerable<Product>> GetAllByOrganisationAsync(
        int organisationId)
    {
        return await _context.Products
            .Where(p => p.OrganisationId == organisationId)
            .OrderBy(p => p.ProductName)
            .ToListAsync();
    }

    public async Task<Product?> GetByProductIdAsync(
        int productId,
        int organisationId)
    {
        return await _context.Products
            .FirstOrDefaultAsync(p =>
                p.ProductId == productId &&
                p.OrganisationId == organisationId);
    }

    public async Task<Product?> GetByCodeAsync(
        string productCode,
        int organisationId)
    {
        return await _context.Products
            .FirstOrDefaultAsync(p =>
                p.ProductCode == productCode &&
                p.OrganisationId == organisationId);
    }

    public async Task<Product?> GetByBarcodeAsync(
        string barcode,
        int organisationId)
    {
        return await _context.Products
            .FirstOrDefaultAsync(p =>
                p.Barcode == barcode &&
                p.OrganisationId == organisationId);
    }

    public async Task<IEnumerable<Product>> SearchAsync(
        string search,
        int organisationId)
    {
        search ??= string.Empty;

        return await _context.Products
            .Where(p =>
                p.OrganisationId == organisationId &&
                (
                    p.ProductName.Contains(search) ||
                    (p.ProductCode != null &&
                     p.ProductCode.Contains(search)) ||
                    (p.Barcode != null &&
                     p.Barcode.Contains(search))
                ))
            .OrderBy(p => p.ProductName)
            .ToListAsync();
    }

    public async Task<bool> ProductCodeExistsAsync(
        string productCode,
        int organisationId)
    {
        return await _context.Products
            .AnyAsync(p =>
                p.ProductCode == productCode &&
                p.OrganisationId == organisationId);
    }
}
