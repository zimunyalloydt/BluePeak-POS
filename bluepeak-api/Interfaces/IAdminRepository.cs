using bluepeak_api.DTOs.Admin;

namespace bluepeak_api.Interfaces;

public interface IAdminRepository
{
    Task<DashboardDto> GetDashboardAsync();
    Task<List<SaleListDto>> GetSalesAsync();
    Task<List<UserListDto>> GetUsersAsync();
    Task CreateUserAsync(CreateUserDto dto);
    

    Task<List<PermissionDto>> GetUserPermissionsAsync(int userId);

Task UpdateUserPermissionsAsync(
    int userId,
    List<int> permissionIds
);
}