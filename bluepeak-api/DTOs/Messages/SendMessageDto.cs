namespace bluepeak_api.DTOs.Messages;

public class SendMessageDto
{
    public int ReceiverUserId { get; set; }

    public string Text { get; set; } = string.Empty;
}