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

    public async Task<User?> GetByUsernameAsync(string username)
    {
        return await _context.Users
            .Include(x => x.Role)
            .FirstOrDefaultAsync(x => x.Username == username);
    }

    public async Task<bool> UsernameExistsAsync(string username)
    {
        return await _context.Users
            .AnyAsync(x => x.Username == username);
    }

    public async Task<List<string>> GetUserPermissionsAsync(int userId)
{
    return await _context.UserPermissions
        .Where(x => x.UserId == userId)
        .Select(x => x.Permission.Name)
        .ToListAsync();
}
}