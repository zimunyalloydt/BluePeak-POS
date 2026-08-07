using bluepeak_api.DTOs.Notifications;

namespace bluepeak_api.Services.Interfaces;

public interface INotificationService
{
    Task<List<NotificationDto>> GetMyNotificationsAsync(int userId);

    Task<int> GetUnreadCountAsync(int userId);

    Task MarkAsReadAsync(int notificationId, int userId);
}