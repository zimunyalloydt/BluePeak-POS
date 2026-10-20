using bluepeak_api.Data;
using bluepeak_api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace bluepeak_api.Services;

public class PermissionService : IPermissionService
{
    private readonly AppDbContext _context;
    private readonly IOrganisationContext _organisationContext;

    public PermissionService(
        AppDbContext context,
        IOrganisationContext organisationContext)
    {
        _context = context;
        _organisationContext = organisationContext;
    }

    public async Task<bool> HasPermissionAsync(
        int userId,
        string permission)
    {
        var organisationId = _organisationContext.OrganisationId;

        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u =>
                u.UserId == userId &&
                u.OrganisationId == organisationId &&
                u.IsActive);

        // Reject nonexistent, inactive, or foreign-organisation users.
        if (user == null)
        {
            return false;
        }

        // Administrators retain their existing administrative access.
        if (user.Role?.RoleName == "Admin")
        {
            return true;
        }

        return await _context.UserPermissions
            .AnyAsync(up =>
                up.UserId == userId &&
                up.User.OrganisationId == organisationId &&
                up.User.IsActive &&
                up.Permission.Name == permission);
    }
}