using bluepeak_api.Data;
using Microsoft.EntityFrameworkCore;

public class PermissionService : IPermissionService
{
    private readonly AppDbContext _context;

    public PermissionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> HasPermissionAsync(int userId, string permission)
    {
        return await _context.UserPermissions.AnyAsync(x =>
            x.UserId == userId &&
            x.Permission.Name == permission);
    }
}