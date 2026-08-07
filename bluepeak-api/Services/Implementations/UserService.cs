using Microsoft.EntityFrameworkCore;
using bluepeak_api.Data;
using bluepeak_api.DTOs.Users;
using bluepeak_api.Services.Interfaces;

namespace bluepeak_api.Services.Implementations;

public class UserService : IUserService
{
    private readonly AppDbContext _context;

    public UserService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ChatUserDto>> GetChatUsersAsync(int currentUserId)
    {
        return await _context.Users
            .Include(u => u.Role)
            .Where(u => u.UserId != currentUserId)
            .OrderBy(u => u.FirstName)
            .Select(u => new ChatUserDto
            {
                UserId = u.UserId,
                Name = $"{u.FirstName} {u.LastName}",
                Role = u.Role.RoleName
            })
            .ToListAsync();
    }
}