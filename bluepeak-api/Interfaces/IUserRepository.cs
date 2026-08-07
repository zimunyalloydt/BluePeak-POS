using bluepeak_api.Models;

namespace bluepeak_api.Interfaces;

public interface IUserRepository : IGenericRepository<User>
{
    Task<User?> GetByUsernameAsync(string username);

    Task<bool> UsernameExistsAsync(string username);

    Task<List<string>> GetUserPermissionsAsync(int userId);
}