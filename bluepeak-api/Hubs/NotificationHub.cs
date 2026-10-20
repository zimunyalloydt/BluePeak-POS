using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace bluepeak_api.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    public async Task JoinUserGroup(int userId)
    {
        var authenticatedUserId = Context.User?
            .FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(authenticatedUserId, out var currentUserId))
        {
            throw new HubException("Unable to identify the authenticated user.");
        }

        if (userId != currentUserId)
        {
            throw new HubException(
                "You are not authorised to join another user's notification group.");
        }

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            $"User_{currentUserId}");
    }
}
