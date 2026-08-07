using bluepeak_api.Models;

namespace bluepeak_api.Interfaces;

public interface ITokenService
{
    string GenerateToken(User user);
}