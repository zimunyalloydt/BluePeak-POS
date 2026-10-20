using bluepeak_api.Data;
using bluepeak_api.DTOs.Admin;
using bluepeak_api.Interfaces;
using bluepeak_api.Models;
using Microsoft.EntityFrameworkCore;

namespace bluepeak_api.Repositories;

public class AdminRepository : IAdminRepository
{
    private readonly AppDbContext _context;
    private readonly IOrganisationContext _organisationContext;

    public AdminRepository(
        AppDbContext context,
        IOrganisationContext organisationContext)
    {
        _context = context;
        _organisationContext = organisationContext;
    }

    private int CurrentOrganisationId =>
        _organisationContext.OrganisationId;

    private async Task<User> GetOrganisationUserAsync(int userId)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u =>
                u.UserId == userId &&
                u.OrganisationId == CurrentOrganisationId);

        if (user == null)
        {
            throw new KeyNotFoundException(
                "User not found in your organisation.");
        }

        return user;
    }

    public async Task<DashboardDto> GetDashboardAsync()
    {
        var organisationId = CurrentOrganisationId;
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var sales = await _context.Sales
            .Where(s =>
                s.OrganisationId == organisationId &&
                s.SaleDate >= today &&
                s.SaleDate < tomorrow)
            .Include(s => s.Items)
                .ThenInclude(i => i.Product)
            .ToListAsync();

        return new DashboardDto
        {
            TodaySales = sales.Sum(s => s.Total),

            Transactions = sales.Count,

            AverageSale = sales.Count == 0
                ? 0
                : sales.Average(s => s.Total),

            TodayProfit = sales.Sum(s =>
                s.Items.Sum(i =>
                    (i.UnitPrice - (i.Product?.CostPrice ?? 0))
                    * i.Quantity))
        };
    }

    public async Task<List<SaleListDto>> GetSalesAsync()
    {
        var organisationId = CurrentOrganisationId;

        return await _context.Sales
            .Where(s => s.OrganisationId == organisationId)
            .Include(s => s.User)
            .Include(s => s.Items)
                .ThenInclude(i => i.Product)
            .OrderByDescending(s => s.SaleDate)
            .Select(s => new SaleListDto
            {
                SaleId = s.SaleId,
                SaleDate = s.SaleDate,

                Cashier = s.User == null
                    ? "Unknown"
                    : s.User.FirstName + " " + s.User.LastName,

                Items = s.Items.Count,

                PaymentMethod = s.PaymentMethod,

                Total = s.Total,

                Profit = s.Items.Sum(i =>
                    (i.UnitPrice -
                        (i.Product == null ? 0 : i.Product.CostPrice))
                    * i.Quantity)
            })
            .ToListAsync();
    }

    public async Task<List<UserListDto>> GetUsersAsync()
    {
        var organisationId = CurrentOrganisationId;

        return await _context.Users
            .Where(u => u.OrganisationId == organisationId)
            .Include(u => u.Role)
            .OrderBy(u => u.FirstName)
            .Select(u => new UserListDto
            {
                UserId = u.UserId,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Username = u.Username,
                Email = u.Email,
                Phone = u.Phone ?? "",
                Role = u.Role != null ? u.Role.RoleName : "Unknown",
                IsActive = u.IsActive
            })
            .ToListAsync();
    }

    public async Task CreateUserAsync(CreateUserDto dto)
    {
        var organisationId = CurrentOrganisationId;

        if (await _context.Users.AnyAsync(u =>
                u.OrganisationId == organisationId &&
                u.Username == dto.Username))
        {
            throw new InvalidOperationException(
                "Username already exists in your organisation.");
        }

        if (await _context.Users.AnyAsync(u =>
                u.OrganisationId == organisationId &&
                u.Email == dto.Email))
        {
            throw new InvalidOperationException(
                "Email already exists in your organisation.");
        }

        // Confirm that the requested role exists.
       var requestedRole = await _context.Roles
    .FirstOrDefaultAsync(r => r.RoleId == dto.RoleId);

if (requestedRole == null)
{
    throw new ArgumentException("Invalid role.");
}

if (string.Equals(
        requestedRole.RoleName,
        "Admin",
        StringComparison.OrdinalIgnoreCase))
{
    throw new InvalidOperationException(
        "Creating administrator accounts through staff management is not permitted.");
}

        var user = new User
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Username = dto.Username,
            Email = dto.Email,
            Phone = dto.Phone,
            RoleId = dto.RoleId,
            OrganisationId = organisationId,
            IsActive = dto.IsActive,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
        };

        _context.Users.Add(user);

        await _context.SaveChangesAsync();
    }

    public async Task<List<PermissionDto>> GetUserPermissionsAsync(
        int userId)
    {
        // Confirm that the target user belongs to this organisation.
        await GetOrganisationUserAsync(userId);

        var assigned = await _context.UserPermissions
            .Where(up => up.UserId == userId)
            .Select(up => up.PermissionId)
            .ToListAsync();

        return await _context.Permissions
            .Select(p => new PermissionDto
            {
                PermissionId = p.PermissionId,
                Name = p.Name,
                Assigned = assigned.Contains(p.PermissionId)
            })
            .ToListAsync();
    }

    public async Task UpdateUserPermissionsAsync(
        int userId,
        List<int> permissionIds)
    {
        // Never modify permissions for a user in another organisation.
        await GetOrganisationUserAsync(userId);

        var validPermissionIds = await _context.Permissions
            .Where(p => permissionIds.Contains(p.PermissionId))
            .Select(p => p.PermissionId)
            .ToListAsync();

        if (validPermissionIds.Count != permissionIds.Distinct().Count())
        {
            throw new ArgumentException(
                "One or more permission IDs are invalid.");
        }

        var existing = _context.UserPermissions
            .Where(up => up.UserId == userId);

        _context.UserPermissions.RemoveRange(existing);

        foreach (var permissionId in permissionIds.Distinct())
        {
            _context.UserPermissions.Add(new UserPermission
            {
                UserId = userId,
                PermissionId = permissionId
            });
        }

        await _context.SaveChangesAsync();
    }

    public async Task<SaleDetailsDto?> GetSaleDetailsAsync(int saleId)
    {
        var organisationId = CurrentOrganisationId;

        var sale = await _context.Sales
            .Where(s =>
                s.SaleId == saleId &&
                s.OrganisationId == organisationId)
            .Include(s => s.User)
            .Include(s => s.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync();

        if (sale == null)
        {
            return null;
        }

        return new SaleDetailsDto
        {
            SaleId = sale.SaleId,
            SaleDate = sale.SaleDate,

            Cashier = sale.User == null
                ? "Unknown"
                : sale.User.FirstName + " " + sale.User.LastName,

            CustomerName = sale.CustomerName,
            PaymentMethod = sale.PaymentMethod,

            Subtotal = sale.Subtotal,
            Vat = sale.Vat,
            Total = sale.Total,

            AmountPaid = sale.AmountPaid,
            ChangeGiven = sale.ChangeGiven,

            Profit = sale.Items.Sum(i =>
                (i.UnitPrice - (i.Product?.CostPrice ?? 0))
                * i.Quantity),

            Items = sale.Items.Select(i => new SaleItemDetailsDto
            {
                SaleItemId = i.SaleItemId,
                ProductId = i.ProductId,

                ProductName = i.Product?.ProductName ?? "Unknown Product",

                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                CostPrice = i.Product?.CostPrice ?? 0,
                Total = i.Total,

                Profit = (i.UnitPrice - (i.Product?.CostPrice ?? 0))
                    * i.Quantity
            }).ToList()
        };
    }
}