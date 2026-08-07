namespace bluepeak_api.DTOs.Admin;

public class CreateUserDto
{
    public string FirstName { get; set; } = "";

    public string LastName { get; set; } = "";

    public string Username { get; set; } = "";

    public string Email { get; set; } = "";

    public string Phone { get; set; } = "";

    public string Password { get; set; } = "";

    public int RoleId { get; set; }

    public bool IsActive { get; set; } = true;
}