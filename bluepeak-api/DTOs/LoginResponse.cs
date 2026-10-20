namespace bluepeak_api.DTOs.Authentication;

public class LoginResponse
{
    public int UserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Username { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public string Token { get; set; } = string.Empty;

    public DateTime Expiry { get; set; }

    public List<string> Permissions { get; set; } = new();

    public int OrganisationId { get; set; }

    public string OrganisationName { get; set; } = string.Empty;

    public string OrganisationCode { get; set; } = string.Empty;

    public string? OrganisationAddress { get; set; }

    public string? OrganisationPhoneNumber { get; set; }

    public string? OrganisationEmail { get; set; }

    public string? OrganisationLogoUrl { get; set; }
}