namespace bluepeak_api.DTOs.Authentication;

public class LoginResponseDto
{
    public int UserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Username { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public string Token { get; set; } = string.Empty;

    public DateTime Expiry { get; set; }

    public List<string> Permissions { get; set; } = new();
}