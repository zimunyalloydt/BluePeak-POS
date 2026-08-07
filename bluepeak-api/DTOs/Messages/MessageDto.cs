
namespace bluepeak_api.DTOs.Messages;

public class MessageDto
{
    public int MessageId { get; set; }

    public int SenderUserId { get; set; }

    public string SenderName { get; set; } = string.Empty;

    public int ReceiverUserId { get; set; }

    public string ReceiverName { get; set; } = string.Empty;

    public string Text { get; set; } = string.Empty;

    public DateTime SentAt { get; set; }

    public bool IsRead { get; set; }

    public DateTime? ReadAt { get; set; }
}