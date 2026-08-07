using bluepeak_api.DTOs.Users;

namespace bluepeak_api.Services.Interfaces;
public interface IUserService
{
   
Task<List<ChatUserDto>> GetChatUsersAsync(int currentUserId); 
}