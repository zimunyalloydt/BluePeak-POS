using bluepeak_api.DTOs.Admin;

namespace bluepeak_api.Interfaces;

public interface IAdminService
{
    Task<DashboardDto> GetDashboardAsync();
    Task<List<SaleListDto>> GetSalesAsync();
    Task<List<UserListDto>> GetUsersAsync();
    Task<List<PermissionDto>> GetUserPermissionsAsync(int userId);

Task UpdateUserPermissionsAsync(
    int userId,
    List<int> permissionIds
);
    Task CreateUserAsync(CreateUserDto dto);
}