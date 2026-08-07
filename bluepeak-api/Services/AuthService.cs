using bluepeak_api.DTOs.Authentication;
using bluepeak_api.Interfaces;
using bluepeak_api.Models;

namespace bluepeak_api.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordService _passwordService;
    private readonly ITokenService _tokenService;

    public AuthService(
        IUserRepository userRepository,
        IPasswordService passwordService,
        ITokenService tokenService)
    {
        _userRepository = userRepository;
        _passwordService = passwordService;
        _tokenService = tokenService;
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request)
    {
        var user = await _userRepository.GetByUsernameAsync(request.Username);

        if (user == null)
            return null;

        if (!_passwordService.VerifyPassword(request.Password, user.PasswordHash))
            return null;

        if (!user.IsActive)
            return null;

            var permissions = await _userRepository.GetUserPermissionsAsync(user.UserId);

        return new LoginResponseDto
        {
            UserId = user.UserId,
            Username = user.Username,
            FullName = $"{user.FirstName} {user.LastName}",
            Role = user.Role?.RoleName ?? "",
            Token = _tokenService.GenerateToken(user),
            Expiry = DateTime.UtcNow.AddHours(12),
            Permissions = permissions
        };
    }

    public async Task<bool> RegisterAsync(RegisterUserDto request)
    {
        if (await _userRepository.UsernameExistsAsync(request.Username))
            return false;

        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Username = request.Username,
            Email = request.Email,
            Phone = request.Phone,
            RoleId = request.RoleId,
            PasswordHash = _passwordService.HashPassword(request.Password),
            IsActive = true
        };

await _userRepository.AddAsync(user);
await _userRepository.SaveChangesAsync();

return true;


    }


    
}