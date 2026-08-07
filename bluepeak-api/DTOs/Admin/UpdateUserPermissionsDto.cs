namespace bluepeak_api.DTOs.Admin;

public class UpdateUserPermissionsDto
{
    public List<int> PermissionIds { get; set; } = new();
}