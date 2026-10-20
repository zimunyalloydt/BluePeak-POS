using Microsoft.EntityFrameworkCore;
using bluepeak_api.Data;
using bluepeak_api.DTOs.Users;
using bluepeak_api.Interfaces;
using bluepeak_api.Services.Interfaces;

namespace bluepeak_api.Services.Implementations;

public class UserService : IUserService
{
    private readonly AppDbContext _context;
    private readonly IOrganisationContext _organisationContext;

    public UserService(
        AppDbContext context,
        IOrganisationContext organisationContext)
    {
        _context = context;
        _organisationContext = organisationContext;
    }

    public async Task<List<ChatUserDto>> GetChatUsersAsync(
        int currentUserId)
    {
        var organisationId = _organisationContext.OrganisationId;

        var currentUserExists = await _context.Users
            .AnyAsync(u =>
                u.UserId == currentUserId &&
                u.OrganisationId == organisationId &&
                u.IsActive);

        if (!currentUserExists)
        {
            throw new UnauthorizedAccessException(
                "The authenticated user is not active in this organisation.");
        }

        return await _context.Users
            .AsNoTracking()
            .Where(u =>
                u.OrganisationId == organisationId &&
                u.IsActive &&
                u.UserId != currentUserId)
            .OrderBy(u => u.FirstName)
            .Select(u => new ChatUserDto
            {
                UserId = u.UserId,
                Name = $"{u.FirstName} {u.LastName}",
                Role = u.Role != null
                    ? u.Role.RoleName
                    : "Unknown"
            })
            .ToListAsync();
    }
}
