using System.Security.Claims;
using bluepeak_api.Interfaces;

namespace bluepeak_api.Services;

public sealed class OrganisationContext : IOrganisationContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public OrganisationContext(
        IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public int OrganisationId
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;

            if (user?.Identity?.IsAuthenticated != true)
            {
                throw new UnauthorizedAccessException(
                    "An authenticated user is required.");
            }

            var organisationClaim =
                user.FindFirst("OrganisationId")?.Value;

            if (!int.TryParse(organisationClaim, out var organisationId)
                || organisationId <= 0)
            {
                throw new UnauthorizedAccessException(
                    "The authenticated user has no valid organisation.");
            }

            return organisationId;
        }
    }
}
