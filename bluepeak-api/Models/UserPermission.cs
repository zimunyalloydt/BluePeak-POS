namespace bluepeak_api.Models;

public class UserPermission
{
    public int UserId { get; set; }

    public User User { get; set; } = null!;

    public int PermissionId { get; set; }

    public Permission Permission { get; set; } = null!;
}