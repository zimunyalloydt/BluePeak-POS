namespace bluepeak_api.DTOs.Admin;

public class UserListDto
{
    public int UserId { get; set; }

    public string FirstName { get; set; } = "";

    public string LastName { get; set; } = "";

    public string Username { get; set; } = "";

    public string Email { get; set; } = "";

    public string Phone { get; set; } = "";

    public string Role { get; set; } = "";

    public bool IsActive { get; set; }
}