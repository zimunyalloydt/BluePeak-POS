namespace bluepeak_api.DTOs.Notifications;

public class NotificationDto
{
    public int NotificationId { get; set; }

    public string Title { get; set; } = "";

    public string Message { get; set; } = "";

    public string Type { get; set; } = "";

    public bool IsRead { get; set; }

    public DateTime CreatedAt { get; set; }
}