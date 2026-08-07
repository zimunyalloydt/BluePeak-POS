using bluepeak_api.Models;

namespace bluepeak_api.Interfaces;

public interface ISaleRepository
{
    Task AddSaleAsync(Sale sale);

    Task SaveChangesAsync();
}