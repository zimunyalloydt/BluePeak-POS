using System.ComponentModel.DataAnnotations;

namespace bluepeak_api.DTOs.Authentication;

public class RegisterUserDto
{
    [Required]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    public string LastName { get; set; } = string.Empty;

    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    public string? Email { get; set; }

    public string? Phone { get; set; }

    [Required]
    public int RoleId { get; set; }
}