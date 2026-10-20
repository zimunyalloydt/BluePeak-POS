using Microsoft.EntityFrameworkCore;
using bluepeak_api.Data;
using bluepeak_api.Interfaces;
using bluepeak_api.Models;

namespace bluepeak_api.Repositories;

public class UserRepository : GenericRepository<User>, IUserRepository
{
public UserRepository(AppDbContext context)
: base(context)
{
}

public async Task<User?> GetByUsernameAsync(
    string username,
    string organisationCode)
{
    return await _context.Users
        .Include(user => user.Role)
        .Include(user => user.Organisation)
        .FirstOrDefaultAsync(user =>
            user.Username == username &&
            user.Organisation != null &&
            user.Organisation.OrganisationCode == organisationCode &&
            user.Organisation.IsActive);
}
public async Task<bool> UsernameExistsAsync(
    string username,
    int organisationId)
{
    return await _context.Users
        .AnyAsync(user =>
            user.Username == username &&
            user.OrganisationId == organisationId);
}
public async Task<Organisation?> GetOrganisationByCodeAsync(
    string organisationCode)
{
    return await _context.Organisations
        .FirstOrDefaultAsync(organisation =>
            organisation.OrganisationCode == organisationCode &&
            organisation.IsActive);
}
public async Task<List<string>> GetUserPermissionsAsync(int userId)
{
    return await _context.UserPermissions
        .Where(permission => permission.UserId == userId)
        .Select(permission => permission.Permission.Name)
        .ToListAsync();
}

}