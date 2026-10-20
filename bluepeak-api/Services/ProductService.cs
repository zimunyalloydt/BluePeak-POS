using bluepeak_api.DTOs.Products;
using bluepeak_api.Interfaces;
using bluepeak_api.Models;
using bluepeak_api.Data;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using System.IO;

namespace bluepeak_api.Services;

public class ProductService : IProductService
{
private readonly IProductRepository _repository;
private readonly AppDbContext _context;
private readonly IOrganisationContext _organisationContext;

private readonly IPermissionService _permissionService;
private readonly IHttpContextAccessor _httpContextAccessor;

public ProductService(
    IProductRepository repository,
    AppDbContext context,
    IOrganisationContext organisationContext,
    IPermissionService permissionService,
    IHttpContextAccessor httpContextAccessor)
{
    _repository = repository;
    _context = context;
    _organisationContext = organisationContext;
    _permissionService = permissionService;
    _httpContextAccessor = httpContextAccessor;
}
private int CurrentOrganisationId =>
    _organisationContext.OrganisationId;

    private async Task EnsureManageProductsPermissionAsync()
{
    var user = _httpContextAccessor.HttpContext?.User;

    if (user?.Identity?.IsAuthenticated != true)
    {
        throw new UnauthorizedAccessException(
            "Authentication is required.");
    }

    var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    if (!int.TryParse(userIdClaim, out var userId) || userId <= 0)
    {
        throw new UnauthorizedAccessException(
            "The authenticated user ID is invalid.");
    }

    var hasPermission = await _permissionService.HasPermissionAsync(
        userId,
        "Manage Products");

    if (!hasPermission)
    {
        throw new UnauthorizedAccessException(
            "You do not have permission to manage products.");
    }
}
public async Task<IEnumerable<ProductDto>> GetAllAsync()
{
    var products =
        await _repository.GetAllByOrganisationAsync(
            CurrentOrganisationId);
    return products.Select(MapToDto);
}
public async Task<ProductDto?> GetByIdAsync(int id)
{
    var product =
        await _repository.GetByProductIdAsync(
            id,
            CurrentOrganisationId);
    return product == null ? null : MapToDto(product);
}
public async Task<IEnumerable<ProductDto>> SearchAsync(
    string search)
{
    var products = await _repository.SearchAsync(
        search ?? string.Empty,
        CurrentOrganisationId);
    return products.Select(MapToDto);
}
public async Task<bool> CreateAsync(CreateProductDto dto)
{
    await EnsureManageProductsPermissionAsync();
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
    var organisationId = CurrentOrganisationId;
    // Product codes must be unique within the organisation.
    if (await _repository.ProductCodeExistsAsync(
            dto.ProductCode,
            organisationId))
    {
        return false;
    }
    string? imagePath = null;
    if (dto.Image != null)
    {
        var uploads = Path.Combine(
            Directory.GetCurrentDirectory(),
            "wwwroot",
            "products");
        Directory.CreateDirectory(uploads);
        var fileName =
            Guid.NewGuid().ToString() +
            Path.GetExtension(dto.Image.FileName);
        var fullPath = Path.Combine(uploads, fileName);
        await using (var stream = new FileStream(
            fullPath,
            FileMode.Create))
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
        ImageUrl = imagePath,
        // Never accept organisation ownership from the client.
        OrganisationId = organisationId
    };
    await _repository.AddAsync(product);
    await _repository.SaveChangesAsync();
    return true;
}
public async Task<bool> UpdateAsync(
    
    int id,
    UpdateProductDto dto)
{
    await EnsureManageProductsPermissionAsync();
    var organisationId = CurrentOrganisationId;

    var product = await _repository.GetByProductIdAsync(
        id,
        organisationId);

    if (product == null)
        return false;

    product.ProductName = dto.ProductName;
    product.Barcode = dto.Barcode;
    product.SellingPrice = dto.SellingPrice;
    product.CostPrice = dto.CostPrice;
    product.IsActive = dto.IsActive;
    product.QuantityInStock = dto.QuantityInStock;

    if (dto.Image != null && dto.Image.Length > 0)
    {
        var uploads = Path.Combine(
            Directory.GetCurrentDirectory(),
            "wwwroot",
            "products");

        Directory.CreateDirectory(uploads);

        var extension = Path.GetExtension(dto.Image.FileName);
        var fileName = $"{Guid.NewGuid()}{extension}";
        var fullPath = Path.Combine(uploads, fileName);

        await using (var stream = new FileStream(
            fullPath,
            FileMode.Create))
        {
            await dto.Image.CopyToAsync(stream);
        }

        product.ImageUrl = "/products/" + fileName;
    }
    else if (!string.IsNullOrWhiteSpace(dto.ImageUrl))
    {
        product.ImageUrl = dto.ImageUrl;
    }

    _repository.Update(product);
    await _repository.SaveChangesAsync();

    return true;
}
public async Task<ProductDto?> AddStockAsync(
    
    int productId,
    StockAdjustmentDto dto)
{
    await EnsureManageProductsPermissionAsync();
    if (dto.Quantity <= 0)
    {
        throw new ArgumentException(
            "Quantity must be greater than zero.");
    }
    var product =
        await _repository.GetByProductIdAsync(
            productId,
            CurrentOrganisationId);
    if (product == null)
        return null;
    product.QuantityInStock += dto.Quantity;
    _repository.Update(product);
    await _repository.SaveChangesAsync();
    return MapToDto(product);
}
public async Task<ProductDto?> RemoveStockAsync(

    
    int productId,
    StockAdjustmentDto dto)
{
    await EnsureManageProductsPermissionAsync();
    if (dto.Quantity <= 0)
    {
        throw new ArgumentException(
            "Quantity must be greater than zero.");
    }
    var product =
        await _repository.GetByProductIdAsync(
            productId,
            CurrentOrganisationId);
    if (product == null)
        return null;
    if (product.QuantityInStock < dto.Quantity)
    {
        throw new InvalidOperationException(
            $"Cannot remove {dto.Quantity} unit(s). " +
            $"Only {product.QuantityInStock} unit(s) " +
            "are currently in stock.");
    }
    product.QuantityInStock -= dto.Quantity;
    _repository.Update(product);
    await _repository.SaveChangesAsync();
    return MapToDto(product);
}
public async Task<bool> DeleteAsync(int id)
{
    await EnsureManageProductsPermissionAsync();
    var organisationId = CurrentOrganisationId;
    var product =
        await _repository.GetByProductIdAsync(
            id,
            organisationId);
    if (product == null)
        return false;
    // Preserve historical records when a product has been sold
    // or refunded. Only deactivate this organisation's product.
    var hasSales = await _context.SaleItems
        .AnyAsync(s =>
            s.ProductId == id &&
            s.Sale != null &&
            s.Sale.User != null &&
            s.Sale.User.OrganisationId == organisationId);
    var hasRefunds = await _context.RefundItems
        .AnyAsync(r =>
            r.ProductId == id &&
            r.Refund != null &&
            r.Refund.Sale != null &&
            r.Refund.Sale.User != null &&
            r.Refund.Sale.User.OrganisationId == organisationId);
    if (hasSales || hasRefunds)
    {
        product.IsActive = false;
        _repository.Update(product);
        await _repository.SaveChangesAsync();
        return true;
    }
    _repository.Delete(product);
    await _repository.SaveChangesAsync();
    return true;
}
private static ProductDto MapToDto(Product product)
{
    return new ProductDto
    {
        ProductId = product.ProductId,
        ProductCode = product.ProductCode ?? "",
        ProductName = product.ProductName,
        Barcode = product.Barcode,
        SellingPrice = product.SellingPrice,
        CostPrice = product.CostPrice,
        Profit = product.SellingPrice - product.CostPrice,
        QuantityInStock = product.QuantityInStock,
        IsActive = product.IsActive,
        ImageUrl = product.ImageUrl
    };
}

}