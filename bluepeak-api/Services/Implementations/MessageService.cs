using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using bluepeak_api.Data;
using bluepeak_api.DTOs.Messages;
using bluepeak_api.Hubs;
using bluepeak_api.Models;
using bluepeak_api.Services.Interfaces;

namespace bluepeak_api.Services.Implementations;

public class MessageService : IMessageService
{
    private readonly AppDbContext _context;
    private readonly IHubContext<NotificationHub> _hub;

    public MessageService(
        AppDbContext context,
        IHubContext<NotificationHub> hub)
    {
        _context = context;
        _hub = hub;
    }

    public async Task<MessageDto> SendMessageAsync(
        int senderId,
        CreateMessageDto dto)
    {
        var message = new Message
        {
            SenderUserId = senderId,
            ReceiverUserId = dto.ReceiverUserId,
            Text = dto.Text,
            SentAt = DateTime.UtcNow
        };

        _context.Messages.Add(message);

        await _context.SaveChangesAsync();

       var messageDto = new MessageDto
{
    MessageId = message.MessageId,
    SenderUserId = message.SenderUserId,
    ReceiverUserId = message.ReceiverUserId,

    SenderName = "",
    ReceiverName = "",

    Text = message.Text,
    SentAt = message.SentAt,
    IsRead = message.IsRead,
    ReadAt = message.ReadAt
};

await _hub.Clients
    .Group($"User_{dto.ReceiverUserId}")
    .SendAsync(
        "ReceiveNotification",
        new
        {
            title = "New Message",
            message = $"You received a message",
            type = "message"
        });

await _hub.Clients
    .Group($"User_{dto.ReceiverUserId}")
    .SendAsync("ReceiveMessage", messageDto);

        return new MessageDto
        {
            MessageId = message.MessageId,
            SenderUserId = senderId,
            ReceiverUserId = dto.ReceiverUserId,
            Text = message.Text,
            SentAt = message.SentAt,
            IsRead = message.IsRead
        };
    }



    public async Task<List<MessageDto>> GetConversationAsync(
    int userId,
    int otherUserId)
 {
    return await _context.Messages
        .Include(m => m.Sender)
        .Include(m => m.Receiver)
        .Where(m =>
            (m.SenderUserId == userId && m.ReceiverUserId == otherUserId) ||
            (m.SenderUserId == otherUserId && m.ReceiverUserId == userId))
        .OrderBy(m => m.SentAt)
        .Select(m => new MessageDto
        {
            MessageId = m.MessageId,

            SenderUserId = m.SenderUserId,
            SenderName = m.Sender != null
                ? $"{m.Sender.FirstName} {m.Sender.LastName}"
                : "",

            ReceiverUserId = m.ReceiverUserId,
            ReceiverName = m.Receiver != null
                ? $"{m.Receiver.FirstName} {m.Receiver.LastName}"
                : "",

            Text = m.Text,
            SentAt = m.SentAt,
            IsRead = m.IsRead,
            ReadAt = m.ReadAt
        })
        .ToListAsync();
}
   public async Task<List<MessageDto>> GetMyChatsAsync(int userId)
{
    var messages = await _context.Messages
        .Include(m => m.Sender)
        .Include(m => m.Receiver)
        .Where(m =>
            m.SenderUserId == userId ||
            m.ReceiverUserId == userId)
        .OrderByDescending(m => m.SentAt)
        .ToListAsync();

    var chats = messages
        .GroupBy(m =>
            m.SenderUserId == userId
                ? m.ReceiverUserId
                : m.SenderUserId)
        .Select(g =>
        {
            var last = g.First();

            var otherUser = last.SenderUserId == userId
                ? last.Receiver
                : last.Sender;

            return new MessageDto
            {
                MessageId = last.MessageId,

                SenderUserId = last.SenderUserId,
                ReceiverUserId = last.ReceiverUserId,

                SenderName = last.Sender != null
                    ? $"{last.Sender.FirstName} {last.Sender.LastName}"
                    : "",

                ReceiverName = last.Receiver != null
                    ? $"{last.Receiver.FirstName} {last.Receiver.LastName}"
                    : "",

                Text = last.Text,
                SentAt = last.SentAt,
                IsRead = last.IsRead,
                ReadAt = last.ReadAt
            };
        })
        .OrderByDescending(x => x.SentAt)
        .ToList();

    return chats;
}


    public async Task MarkAsReadAsync(int messageId)
{
    var message = await _context.Messages.FindAsync(messageId);

    if (message == null)
        return;

    message.IsRead = true;
    message.ReadAt = DateTime.UtcNow;

    await _context.SaveChangesAsync();
}

public async Task<int> GetUnreadCountAsync(int userId)
{
    return await _context.Messages.CountAsync(m =>
        m.ReceiverUserId == userId &&
        !m.IsRead);
}
}