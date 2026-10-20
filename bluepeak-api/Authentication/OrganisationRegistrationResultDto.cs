namespace bluepeak_api.DTOs.Authentication;

public class OrganisationRegistrationResultDto
{
    public bool Success { get; set; }

    public string Message { get; set; } = string.Empty;

    public int? OrganisationId { get; set; }

    public string? OrganisationName { get; set; }

    public string? OrganisationCode { get; set; }

    public string? AdminUsername { get; set; }
}
