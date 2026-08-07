using bluepeak_api.DTOs.Messages;

namespace bluepeak_api.Services.Interfaces;

public interface IMessageService
{
    Task<MessageDto> SendMessageAsync(int senderId, CreateMessageDto dto);

    Task<List<MessageDto>> GetConversationAsync(int userId, int otherUserId);

    Task<List<MessageDto>> GetMyChatsAsync(int userId);

    Task<int> GetUnreadCountAsync(int userId);

    Task MarkAsReadAsync(int messageId);
}