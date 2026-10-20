using bluepeak_api.Models;

namespace bluepeak_api.Interfaces;

public interface IProductRepository : IGenericRepository<Product>
{
    Task<IEnumerable<Product>> GetAllByOrganisationAsync(
        int organisationId);

    Task<Product?> GetByProductIdAsync(
        int productId,
        int organisationId);

    Task<Product?> GetByCodeAsync(
        string productCode,
        int organisationId);

    Task<Product?> GetByBarcodeAsync(
        string barcode,
        int organisationId);

    Task<IEnumerable<Product>> SearchAsync(
        string search,
        int organisationId);

    Task<bool> ProductCodeExistsAsync(
        string productCode,
        int organisationId);
}
