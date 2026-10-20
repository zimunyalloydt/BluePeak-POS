using System.ComponentModel.DataAnnotations;

namespace bluepeak_api.Models;

public class Message
{
    public int MessageId { get; set; }

    public int SenderUserId { get; set; }
    public User? Sender { get; set; }

    public int ReceiverUserId { get; set; }
    public User? Receiver { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Text { get; set; } = string.Empty;

    public DateTime SentAt { get; set; } = DateTime.UtcNow;

    public bool IsRead { get; set; } = false;

    public DateTime? ReadAt { get; set; }
}