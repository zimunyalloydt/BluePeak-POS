using bluepeak_api.Models;

namespace bluepeak_api.Interfaces;

public interface IProductRepository : IGenericRepository<Product>
{
    Task<Product?> GetByProductIdAsync(int productId);

    Task<Product?> GetByCodeAsync(string productCode);

    Task<Product?> GetByBarcodeAsync(string barcode);

    Task<IEnumerable<Product>> SearchAsync(string search);

    Task<bool> ProductCodeExistsAsync(string productCode);
}