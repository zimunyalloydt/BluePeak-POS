using bluepeak_api.Models;

namespace bluepeak_api.Interfaces;

public interface IUserRepository : IGenericRepository<User>
{
Task<User?> GetByUsernameAsync(
string username,
string organisationCode);

Task<bool> UsernameExistsAsync(
    string username,
    int organisationId);
Task<Organisation?> GetOrganisationByCodeAsync(
    string organisationCode);
Task<List<string>> GetUserPermissionsAsync(int userId);

}