using bluepeak_api.DTOs.Admin;
using bluepeak_api.Interfaces;

namespace bluepeak_api.Services;

public class AdminService : IAdminService
{
    private readonly IAdminRepository _repository;


public Task<DashboardDto> GetDashboardAsync()
    {
        return _repository.GetDashboardAsync();
    }

    public Task<List<SaleListDto>> GetSalesAsync()
{
    return _repository.GetSalesAsync();
}

public Task<SaleDetailsDto?> GetSaleDetailsAsync(int saleId)
{
    return _repository.GetSaleDetailsAsync(saleId);
}
    public AdminService(IAdminRepository repository)
    {
        _repository = repository;
    }

    public Task<List<UserListDto>> GetUsersAsync()
{
    return _repository.GetUsersAsync();
}

public Task CreateUserAsync(CreateUserDto dto)
{
    return _repository.CreateUserAsync(dto);
}

public Task<List<PermissionDto>> GetUserPermissionsAsync(int userId)
{
    return _repository.GetUserPermissionsAsync(userId);
}

public Task UpdateUserPermissionsAsync(
    int userId,
    List<int> permissionIds)
{
    return _repository.UpdateUserPermissionsAsync(
        userId,
        permissionIds);
}
    
}