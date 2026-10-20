using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using bluepeak_api.Data;
using bluepeak_api.DTOs.Messages;
using bluepeak_api.Hubs;
using bluepeak_api.Interfaces;
using bluepeak_api.Models;
using bluepeak_api.Services.Interfaces;

namespace bluepeak_api.Services.Implementations;

public class MessageService : IMessageService
{
    private readonly AppDbContext _context;
    private readonly IHubContext<NotificationHub> _hub;
    private readonly IOrganisationContext _organisationContext;

    public MessageService(
        AppDbContext context,
        IHubContext<NotificationHub> hub,
        IOrganisationContext organisationContext)
    {
        _context = context;
        _hub = hub;
        _organisationContext = organisationContext;
    }

    private int OrganisationId => _organisationContext.OrganisationId;

    private async Task<User> GetActiveOrganisationUserAsync(int userId)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u =>
                u.UserId == userId &&
                u.OrganisationId == OrganisationId &&
                u.IsActive);

        if (user == null)
        {
            throw new UnauthorizedAccessException(
                "The user is inactive or does not belong to this organisation.");
        }

        return user;
    }

    public async Task<MessageDto> SendMessageAsync(
        int senderId,
        CreateMessageDto dto)
    {
        var sender = await GetActiveOrganisationUserAsync(senderId);
        var receiver = await GetActiveOrganisationUserAsync(dto.ReceiverUserId);

        if (sender.UserId == receiver.UserId)
        {
            throw new ArgumentException(
                "You cannot send a message to yourself.");
        }

        if (string.IsNullOrWhiteSpace(dto.Text))
        {
            throw new ArgumentException("Message text is required.");
        }

        if (dto.Text.Length > 1000)
        {
            throw new ArgumentException(
                "Message text cannot exceed 1000 characters.");
        }

        var message = new Message
        {
            SenderUserId = sender.UserId,
            ReceiverUserId = receiver.UserId,
            Text = dto.Text.Trim(),
            SentAt = DateTime.UtcNow
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        var messageDto = new MessageDto
        {
            MessageId = message.MessageId,
            SenderUserId = sender.UserId,
            SenderName = $"{sender.FirstName} {sender.LastName}",
            ReceiverUserId = receiver.UserId,
            ReceiverName = $"{receiver.FirstName} {receiver.LastName}",
            Text = message.Text,
            SentAt = message.SentAt,
            IsRead = message.IsRead,
            ReadAt = message.ReadAt
        };

        await _hub.Clients
            .Group($"User_{receiver.UserId}")
            .SendAsync("ReceiveNotification", new
            {
                title = "New Message",
                message = "You received a message",
                type = "message"
            });

        await _hub.Clients
            .Group($"User_{receiver.UserId}")
            .SendAsync("ReceiveMessage", messageDto);

        return messageDto;
    }

    public async Task<List<MessageDto>> GetConversationAsync(
        int userId,
        int otherUserId)
    {
        await GetActiveOrganisationUserAsync(userId);
        await GetActiveOrganisationUserAsync(otherUserId);

        return await _context.Messages
            .Where(m =>
                m.Sender != null &&
                m.Receiver != null &&
                m.Sender.OrganisationId == OrganisationId &&
                m.Receiver.OrganisationId == OrganisationId &&
                (
                    (m.SenderUserId == userId &&
                     m.ReceiverUserId == otherUserId) ||
                    (m.SenderUserId == otherUserId &&
                     m.ReceiverUserId == userId)
                ))
            .OrderBy(m => m.SentAt)
            .Select(m => new MessageDto
            {
                MessageId = m.MessageId,
                SenderUserId = m.SenderUserId,
                SenderName = m.Sender != null
                    ? m.Sender.FirstName + " " + m.Sender.LastName
                    : string.Empty,
                ReceiverUserId = m.ReceiverUserId,
                ReceiverName = m.Receiver != null
                    ? m.Receiver.FirstName + " " + m.Receiver.LastName
                    : string.Empty,
                Text = m.Text,
                SentAt = m.SentAt,
                IsRead = m.IsRead,
                ReadAt = m.ReadAt
            })
            .ToListAsync();
    }

    public async Task<List<MessageDto>> GetMyChatsAsync(int userId)
    {
        await GetActiveOrganisationUserAsync(userId);

        var messages = await _context.Messages
            .Where(m =>
                m.Sender != null &&
                m.Receiver != null &&
                m.Sender.OrganisationId == OrganisationId &&
                m.Receiver.OrganisationId == OrganisationId &&
                (m.SenderUserId == userId ||
                 m.ReceiverUserId == userId))
            .Include(m => m.Sender)
            .Include(m => m.Receiver)
            .OrderByDescending(m => m.SentAt)
            .ToListAsync();

        return messages
            .GroupBy(m =>
                m.SenderUserId == userId
                    ? m.ReceiverUserId
                    : m.SenderUserId)
            .Select(g =>
            {
                var last = g.First();

                return new MessageDto
                {
                    MessageId = last.MessageId,
                    SenderUserId = last.SenderUserId,
                    SenderName = last.Sender != null
                        ? $"{last.Sender.FirstName} {last.Sender.LastName}"
                        : string.Empty,
                    ReceiverUserId = last.ReceiverUserId,
                    ReceiverName = last.Receiver != null
                        ? $"{last.Receiver.FirstName} {last.Receiver.LastName}"
                        : string.Empty,
                    Text = last.Text,
                    SentAt = last.SentAt,
                    IsRead = last.IsRead,
                    ReadAt = last.ReadAt
                };
            })
            .OrderByDescending(m => m.SentAt)
            .ToList();
    }

    public async Task MarkAsReadAsync(int messageId, int userId)
    {
        await GetActiveOrganisationUserAsync(userId);

        var message = await _context.Messages
            .FirstOrDefaultAsync(m =>
                m.MessageId == messageId &&
                m.ReceiverUserId == userId &&
                m.Sender != null &&
                m.Receiver != null &&
                m.Sender.OrganisationId == OrganisationId &&
                m.Receiver.OrganisationId == OrganisationId);

        if (message == null)
        {
            throw new KeyNotFoundException(
                "Message not found or you are not its intended recipient.");
        }

        if (message.IsRead)
        {
            return;
        }

        message.IsRead = true;
        message.ReadAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        await GetActiveOrganisationUserAsync(userId);

        return await _context.Messages.CountAsync(m =>
            m.ReceiverUserId == userId &&
            !m.IsRead &&
            m.Sender != null &&
            m.Receiver != null &&
            m.Sender.OrganisationId == OrganisationId &&
            m.Receiver.OrganisationId == OrganisationId);
    }
}
