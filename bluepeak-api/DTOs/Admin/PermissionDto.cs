namespace bluepeak_api.DTOs.Admin;

public class PermissionDto
{
    public int PermissionId { get; set; }

    public string Name { get; set; } = "";

    public bool Assigned { get; set; }
}