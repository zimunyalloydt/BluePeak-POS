using bluepeak_api.Data;
using bluepeak_api.DTOs.Admin;
using bluepeak_api.Interfaces;
using Microsoft.EntityFrameworkCore;
using bluepeak_api.Models;

namespace bluepeak_api.Repositories;

public class AdminRepository : IAdminRepository
{
    private readonly AppDbContext _context;

    public AdminRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardDto> GetDashboardAsync()
    {
        var today = DateTime.UtcNow.Date;

        var sales = await _context.Sales
            .Where(x => x.SaleDate.Date == today)
            .Include(x => x.Items)
                .ThenInclude(i => i.Product)
            .ToListAsync();

        return new DashboardDto
        {
            TodaySales = sales.Sum(x => x.Total),

            Transactions = sales.Count,

            AverageSale = sales.Count == 0
                ? 0
                : sales.Average(x => x.Total),

            TodayProfit = sales.Sum(s =>
                s.Items.Sum(i =>
                    (i.UnitPrice - i.Product!.CostPrice) * i.Quantity))
        };
    }

    public async Task<List<SaleListDto>> GetSalesAsync()
{
    return await _context.Sales
        .Include(x => x.User)
        .Include(x => x.Items)
        .OrderByDescending(x => x.SaleDate)
        .Select(x => new SaleListDto
        {
            SaleId = x.SaleId,

            SaleDate = x.SaleDate,

            Cashier = x.User == null
                ? "Unknown"
                : x.User.FirstName + " " + x.User.LastName,

            Items = x.Items.Count,

            PaymentMethod = x.PaymentMethod,

            Total = x.Total
        })
        .ToListAsync();
}

public async Task<List<UserListDto>> GetUsersAsync()
{
    return await _context.Users
        .Include(u => u.Role)
        .OrderBy(u => u.FirstName)
        .Select(u => new UserListDto
        {
            UserId = u.UserId,
            FirstName = u.FirstName,
            LastName = u.LastName,
            Username = u.Username,
            Email = u.Email,
            Phone = u.Phone,
            Role = u.Role!.RoleName,
            IsActive = u.IsActive
        })
        .ToListAsync();
}

public async Task CreateUserAsync(CreateUserDto dto)
{
    if (await _context.Users.AnyAsync(x => x.Username == dto.Username))
        throw new Exception("Username already exists.");

    if (await _context.Users.AnyAsync(x => x.Email == dto.Email))
        throw new Exception("Email already exists.");

    var user = new User
    {
        FirstName = dto.FirstName,
        LastName = dto.LastName,
        Username = dto.Username,
        Email = dto.Email,
        Phone = dto.Phone,
        RoleId = dto.RoleId,
        IsActive = dto.IsActive,

        PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
    };

    _context.Users.Add(user);

    await _context.SaveChangesAsync();
}

public async Task<List<PermissionDto>> GetUserPermissionsAsync(int userId)
{
    var assigned = await _context.UserPermissions
        .Where(x => x.UserId == userId)
        .Select(x => x.PermissionId)
        .ToListAsync();

    return await _context.Permissions
        .Select(x => new PermissionDto
        {
            PermissionId = x.PermissionId,
            Name = x.Name,
            Assigned = assigned.Contains(x.PermissionId)
        })
        .ToListAsync();
}

public async Task UpdateUserPermissionsAsync(
    int userId,
    List<int> permissionIds)
{
    var existing = _context.UserPermissions
        .Where(x => x.UserId == userId);

    _context.UserPermissions.RemoveRange(existing);

    foreach (var permissionId in permissionIds)
    {
        _context.UserPermissions.Add(
            new UserPermission
            {
                UserId = userId,
                PermissionId = permissionId
            });
    }

    await _context.SaveChangesAsync();
}
}