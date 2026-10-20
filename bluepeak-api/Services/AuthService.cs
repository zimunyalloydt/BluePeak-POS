using Microsoft.EntityFrameworkCore;
using bluepeak_api.Data;
using bluepeak_api.DTOs.Authentication;
using bluepeak_api.Interfaces;
using bluepeak_api.Models;

namespace bluepeak_api.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordService _passwordService;
    private readonly ITokenService _tokenService;
    private readonly AppDbContext _context;

    public AuthService(
        IUserRepository userRepository,
        IPasswordService passwordService,
        ITokenService tokenService,
        AppDbContext context)
    {
        _userRepository = userRepository;
        _passwordService = passwordService;
        _tokenService = tokenService;
        _context = context;
    }

    public async Task<LoginResponseDto?> LoginAsync(
        LoginRequestDto request)
    {
        var organisationCode = request.OrganisationCode
            .Trim()
            .ToUpperInvariant();

        var username = request.Username.Trim();

        var user = await _userRepository.GetByUsernameAsync(
            username,
            organisationCode);

        if (user == null)
            return null;

        if (!_passwordService.VerifyPassword(
                request.Password,
                user.PasswordHash))
        {
            return null;
        }

        if (!user.IsActive)
            return null;

        if (user.Organisation == null ||
            !user.Organisation.IsActive)
        {
            return null;
        }

        var permissions =
            await _userRepository.GetUserPermissionsAsync(user.UserId);

        return new LoginResponseDto
        {
            UserId = user.UserId,
            Username = user.Username,
            FullName = $"{user.FirstName} {user.LastName}",
            Role = user.Role?.RoleName ?? "",
            Token = _tokenService.GenerateToken(user),
            Expiry = DateTime.UtcNow.AddHours(12),
            Permissions = permissions,
OrganisationId = user.OrganisationId,
OrganisationName = user.Organisation.Name,
OrganisationCode = user.Organisation.OrganisationCode,
OrganisationAddress = user.Organisation.Address,
OrganisationPhoneNumber = user.Organisation.PhoneNumber,
OrganisationEmail = user.Organisation.Email,
OrganisationLogoUrl = user.Organisation.LogoUrl
        };
    }

    public async Task<bool> RegisterAsync(RegisterUserDto request)
    {
        // Preserve existing Coldstone registration behaviour.
        var organisation =
            await _userRepository.GetOrganisationByCodeAsync("COLDSTONE");

        if (organisation == null)
            return false;

        if (await _userRepository.UsernameExistsAsync(
                request.Username,
                organisation.OrganisationId))
        {
            return false;
        }

        var user = new User
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Username = request.Username.Trim(),
            Email = request.Email ?? string.Empty,
            Phone = request.Phone,
            RoleId = request.RoleId,
            OrganisationId = organisation.OrganisationId,
            PasswordHash =
                _passwordService.HashPassword(request.Password),
            IsActive = true
        };

        await _userRepository.AddAsync(user);
        await _userRepository.SaveChangesAsync();

        return true;
    }

    public async Task<OrganisationRegistrationResultDto>
        RegisterOrganisationAsync(RegisterOrganisationDto request)
    {
        var organisationCode = request.OrganisationCode
            .Trim()
            .ToUpperInvariant();

        var organisationName = request.OrganisationName.Trim();

        var username = request.Username.Trim();

        var adminEmail = request.AdminEmail.Trim();

        if (await _context.Organisations.AnyAsync(
                o => o.OrganisationCode == organisationCode))
        {
            return new OrganisationRegistrationResultDto
            {
                Success = false,
                Message = "That organisation code is already registered."
            };
        }

        var adminRole = await _context.Roles
            .FirstOrDefaultAsync(r => r.RoleName == "Admin");

        if (adminRole == null)
        {
            throw new InvalidOperationException(
                "The Admin role is missing from the database.");
        }

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        try
        {
            var organisation = new Organisation
            {
                Name = organisationName,
                OrganisationCode = organisationCode,
                Address = request.Address?.Trim(),
                PhoneNumber = request.PhoneNumber?.Trim(),
                Email = request.Email?.Trim(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Organisations.Add(organisation);

            // Save to obtain the generated OrganisationId.
            await _context.SaveChangesAsync();

            var admin = new User
            {
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim(),
                Username = username,
                Email = adminEmail,
                Phone = request.AdminPhone?.Trim(),
                OrganisationId = organisation.OrganisationId,
                RoleId = adminRole.RoleId,
                PasswordHash =
                    _passwordService.HashPassword(request.Password),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

        
            _context.Users.Add(admin);
            // Save to obtain the administrator's generated UserId.
            await _context.SaveChangesAsync();
            // Assign all predefined permissions to the new organisation's
            // administrator. Existing users are not modified.
            var permissionIds = await _context.Permissions
                .Select(p => p.PermissionId)
                .ToListAsync();
            foreach (var permissionId in permissionIds)
            {
                _context.UserPermissions.Add(new UserPermission
                {
                    UserId = admin.UserId,
                    PermissionId = permissionId
                });
            }
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();


            return new OrganisationRegistrationResultDto
            {
                Success = true,
                Message =
                    "Organisation and administrator registered successfully.",
                OrganisationId = organisation.OrganisationId,
                OrganisationName = organisation.Name,
                OrganisationCode = organisation.OrganisationCode,
                AdminUsername = admin.Username
            };
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync();

            // The unique database index also protects against
            // simultaneous registration attempts using the same code.
            var codeExists = await _context.Organisations
                .AsNoTracking()
                .AnyAsync(o => o.OrganisationCode == organisationCode);

            if (codeExists)
            {
                return new OrganisationRegistrationResultDto
                {
                    Success = false,
                    Message =
                        "That organisation code is already registered."
                };
            }

            throw;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}