using bluepeak_api.DTOs.Products;

namespace bluepeak_api.Interfaces;

public interface IProductService
{
    Task<IEnumerable<ProductDto>> GetAllAsync();

    Task<ProductDto?> GetByIdAsync(int id);

    Task<IEnumerable<ProductDto>> SearchAsync(string search);

    Task<bool> CreateAsync(CreateProductDto dto);

    Task<bool> UpdateAsync(int id, UpdateProductDto dto);

Task<ProductDto?> AddStockAsync(
    int productId,
    StockAdjustmentDto dto);

Task<ProductDto?> RemoveStockAsync(
    int productId,
    StockAdjustmentDto dto);
    Task<bool> DeleteAsync(int id);
}