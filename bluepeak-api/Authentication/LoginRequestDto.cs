using System.ComponentModel.DataAnnotations;

namespace bluepeak_api.DTOs.Authentication;

public class LoginRequestDto
{
[Required]
public string Username { get; set; } = string.Empty;

[Required]
public string Password { get; set; } = string.Empty;
// Defaults to Coldstone for backward compatibility.
public string OrganisationCode { get; set; } = "COLDSTONE";

}