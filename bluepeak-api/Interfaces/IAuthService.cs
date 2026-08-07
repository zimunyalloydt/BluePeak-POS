using bluepeak_api.DTOs.Authentication;

namespace bluepeak_api.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto request);

    Task<bool> RegisterAsync(RegisterUserDto request);
}