using bluepeak_api.Data;
using bluepeak_api.Interfaces;
using bluepeak_api.Models;

namespace bluepeak_api.Repositories;

public class SaleRepository : ISaleRepository
{
    private readonly AppDbContext _context;

    public SaleRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddSaleAsync(Sale sale)
    {
        await _context.Sales.AddAsync(sale);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}