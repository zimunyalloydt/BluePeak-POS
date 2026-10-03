using bluepeak_api.DTOs.Products;
using bluepeak_api.Interfaces;
using bluepeak_api.Models;
using System.IO;

namespace bluepeak_api.Services;

public class ProductService : IProductService
{
    private readonly IProductRepository _repository;

    public ProductService(IProductRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<ProductDto>> GetAllAsync()
    {
        var products = await _repository.GetAllAsync();

        return products.Select(x => new ProductDto
        {
            ProductId = x.ProductId,
            ProductCode = x.ProductCode,
            ProductName = x.ProductName,
            Barcode = x.Barcode,
            SellingPrice = x.SellingPrice,
            CostPrice = x.CostPrice,
            Profit = x.SellingPrice - x.CostPrice,
            QuantityInStock = x.QuantityInStock,

IsActive = x.IsActive,
            ImageUrl = x.ImageUrl
        });
    }

    public async Task<ProductDto?> GetByIdAsync(int id)
    {
        var x = await _repository.GetByProductIdAsync(id);

        if (x == null)
            return null;

        return new ProductDto
{
    ProductId = x.ProductId,
    ProductCode = x.ProductCode,
    ProductName = x.ProductName,
    Barcode = x.Barcode,

    SellingPrice = x.SellingPrice,
    CostPrice = x.CostPrice,

    Profit = x.SellingPrice - x.CostPrice,

    QuantityInStock = x.QuantityInStock,
    
    IsActive = x.IsActive,

   

    ImageUrl = x.ImageUrl
};
    }

    public async Task<IEnumerable<ProductDto>> SearchAsync(string search)
    {
        var products = await _repository.SearchAsync(search);

        return products.Select(x => new ProductDto
        {
            ProductId = x.ProductId,
            ProductCode = x.ProductCode,
            ProductName = x.ProductName,
            Barcode = x.Barcode,
            SellingPrice = x.SellingPrice,
            CostPrice = x.CostPrice,
            Profit = x.SellingPrice - x.CostPrice,
           QuantityInStock = x.QuantityInStock,

IsActive = x.IsActive,
            ImageUrl = x.ImageUrl
        });
    }

  public async Task<bool> CreateAsync(CreateProductDto dto)

  
{

    Console.WriteLine("========== CREATE PRODUCT ==========");

if (dto.Image == null)
{
    Console.WriteLine("IMAGE IS NULL");
}
else
{
    Console.WriteLine($"IMAGE RECEIVED: {dto.Image.FileName}");
    Console.WriteLine($"SIZE: {dto.Image.Length}");
}
    if (await _repository.ProductCodeExistsAsync(dto.ProductCode))
        return false;

    string? imagePath = null;

    if (dto.Image != null)
    {
        var uploads = Path.Combine(
            Directory.GetCurrentDirectory(),
            "wwwroot",
            "products"
        );

        Directory.CreateDirectory(uploads);

        var fileName =
            Guid.NewGuid().ToString() +
            Path.GetExtension(dto.Image.FileName);

        var fullPath = Path.Combine(uploads, fileName);

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await dto.Image.CopyToAsync(stream);
        }

        imagePath = "/products/" + fileName;
    }

    var product = new Product
    {
        ProductCode = dto.ProductCode,
        ProductName = dto.ProductName,
        Barcode = dto.Barcode,
        SellingPrice = dto.SellingPrice,
        CostPrice = dto.CostPrice,
        QuantityInStock = dto.QuantityInStock,
        IsActive = dto.IsActive,
        ImageUrl = imagePath
    };

    await _repository.AddAsync(product);
    await _repository.SaveChangesAsync();

    return true;
}

    public async Task<bool> UpdateAsync(int id, UpdateProductDto dto)
    {
        var product = await _repository.GetByProductIdAsync(id);

        if (product == null)
            return false;

        product.ProductName = dto.ProductName;
        product.Barcode = dto.Barcode;
        product.SellingPrice = dto.SellingPrice;
        product.CostPrice = dto.CostPrice;
        
        product.ImageUrl = dto.ImageUrl;
        product.IsActive = dto.IsActive;
        product.QuantityInStock = dto.QuantityInStock;

        _repository.Update(product);
        await _repository.SaveChangesAsync();

        return true;
    }

public async Task<ProductDto?> AddStockAsync(
    int productId,
    StockAdjustmentDto dto)
{
    if (dto.Quantity <= 0)
        throw new ArgumentException(
            "Quantity must be greater than zero.");

    var product =
        await _repository.GetByProductIdAsync(productId);

    if (product == null)
        return null;

    product.QuantityInStock += dto.Quantity;

    _repository.Update(product);

    await _repository.SaveChangesAsync();

    return new ProductDto
    {
        ProductId = product.ProductId,
        ProductCode = product.ProductCode,
        ProductName = product.ProductName,
        Barcode = product.Barcode,
        SellingPrice = product.SellingPrice,
        CostPrice = product.CostPrice,
        Profit =
            product.SellingPrice -
            product.CostPrice,
        QuantityInStock =
            product.QuantityInStock,
        IsActive = product.IsActive,
        ImageUrl = product.ImageUrl
    };
}

public async Task<ProductDto?> RemoveStockAsync(
    int productId,
    StockAdjustmentDto dto)
{
    if (dto.Quantity <= 0)
        throw new ArgumentException(
            "Quantity must be greater than zero.");

    var product =
        await _repository.GetByProductIdAsync(productId);

    if (product == null)
        return null;

    if (product.QuantityInStock < dto.Quantity)
    {
        throw new InvalidOperationException(
            $"Cannot remove {dto.Quantity} unit(s). " +
            $"Only {product.QuantityInStock} unit(s) " +
            $"are currently in stock.");
    }

    product.QuantityInStock -= dto.Quantity;

    _repository.Update(product);

    await _repository.SaveChangesAsync();

    return new ProductDto
    {
        ProductId = product.ProductId,
        ProductCode = product.ProductCode,
        ProductName = product.ProductName,
        Barcode = product.Barcode,
        SellingPrice = product.SellingPrice,
        CostPrice = product.CostPrice,
        Profit =
            product.SellingPrice -
            product.CostPrice,
        QuantityInStock =
            product.QuantityInStock,
        IsActive = product.IsActive,
        ImageUrl = product.ImageUrl
    };
}
    public async Task<bool> DeleteAsync(int id)
    {
        var product = await _repository.GetByProductIdAsync(id);

        if (product == null)
            return false;

        _repository.Delete(product);
        await _repository.SaveChangesAsync();

        return true;
    }
}