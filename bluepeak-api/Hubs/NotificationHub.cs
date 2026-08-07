using Microsoft.AspNetCore.SignalR;

namespace bluepeak_api.Hubs;

public class NotificationHub : Hub
{
    public async Task JoinUserGroup(int userId)
    {
        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            $"User_{userId}"
        );
    }
}