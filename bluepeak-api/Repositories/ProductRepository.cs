using Microsoft.EntityFrameworkCore;
using bluepeak_api.Data;
using bluepeak_api.Interfaces;
using bluepeak_api.Models;

namespace bluepeak_api.Repositories;

public class ProductRepository : GenericRepository<Product>, IProductRepository
{
    public ProductRepository(AppDbContext context)
        : base(context)
    {
    }

    public async Task<Product?> GetByProductIdAsync(int productId)
    {
        return await _context.Products
           // .Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.ProductId == productId);
    }

    public async Task<Product?> GetByCodeAsync(string productCode)
    {
        return await _context.Products
            //.Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.ProductCode == productCode);
    }

    public async Task<Product?> GetByBarcodeAsync(string barcode)
    {
        return await _context.Products
           // .Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.Barcode == barcode);
    }

    public async Task<IEnumerable<Product>> SearchAsync(string search)
    {
        return await _context.Products
           // .Include(x => x.Category)
            .Where(x =>
                x.ProductName.Contains(search) ||
                x.ProductCode.Contains(search) ||
                (x.Barcode != null && x.Barcode.Contains(search)))
            .ToListAsync();
    }

    public async Task<bool> ProductCodeExistsAsync(string productCode)
    {
        return await _context.Products
            .AnyAsync(x => x.ProductCode == productCode);
    }
}