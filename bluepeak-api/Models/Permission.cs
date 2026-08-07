namespace bluepeak_api.Models;

public class Permission
{
    public int PermissionId { get; set; }

    public string Name { get; set; } = "";

    public string Description { get; set; } = "";

    public ICollection<UserPermission> UserPermissions { get; set; }
        = new List<UserPermission>();
}