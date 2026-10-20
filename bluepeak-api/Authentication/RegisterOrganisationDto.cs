using System.ComponentModel.DataAnnotations;

namespace bluepeak_api.DTOs.Authentication;

public class RegisterOrganisationDto
{
    [Required]
    [StringLength(150, MinimumLength = 2)]
    public string OrganisationName { get; set; } = string.Empty;

    [Required]
    [StringLength(30, MinimumLength = 3)]
    [RegularExpression(
        @"^[a-zA-Z0-9-]+$",
        ErrorMessage = "Organisation code may contain only letters, numbers and hyphens.")]
    public string OrganisationCode { get; set; } = string.Empty;

    [StringLength(200)]
    public string? Address { get; set; }

    [Phone]
    [StringLength(30)]
    public string? PhoneNumber { get; set; }

    [EmailAddress]
    [StringLength(150)]
    public string? Email { get; set; }

    [Required]
    [StringLength(50, MinimumLength = 1)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [StringLength(50, MinimumLength = 1)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [StringLength(50, MinimumLength = 3)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(100)]
    public string AdminEmail { get; set; } = string.Empty;

    [Phone]
    [StringLength(20)]
    public string? AdminPhone { get; set; }
}
