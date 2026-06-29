using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;
using ParkingUniversitySystem.Security;

namespace ParkingUniversitySystem.Engine
{
    public class AuthEngine : IAuthEngine
    {
        private readonly IUserRepository _userRepository;
        private readonly IUniversityRepository _universityRepository;
        private readonly IVehicleReferenceRepository _vehicleReferenceRepository;
        private readonly IVehicleRepository _vehicleRepository;
        private readonly IPasswordHasher _passwordHasher;
        private readonly JwtSettings _jwtSettings;

        public AuthEngine(
            IUserRepository userRepository,
            IUniversityRepository universityRepository,
            IVehicleReferenceRepository vehicleReferenceRepository,
            IVehicleRepository vehicleRepository,
            IPasswordHasher passwordHasher,
            IOptions<JwtSettings> jwtSettings)
        {
            _userRepository = userRepository;
            _universityRepository = universityRepository;
            _vehicleReferenceRepository = vehicleReferenceRepository;
            _vehicleRepository = vehicleRepository;
            _passwordHasher = passwordHasher;
            _jwtSettings = jwtSettings.Value;
        }

        public async Task<(SignupResponse? Success, string? ErrorMessage)> SignupAsync(SignupRequest request)
        {
            var role = request.Role.Trim().ToLowerInvariant();

            if (!UserRoles.IsValidForSignup(role))
            {
                return (null, $"Invalid role. Allowed values: {string.Join(", ", UserRoles.SignupRoles)}.");
            }

            var universityRecord = await _universityRepository.GetByStoredIdAsync(request.StoredId.Trim());
            if (universityRecord is null)
            {
                return (null, "University ID not found. Please check your ID and try again.");
            }

            if (!string.Equals(universityRecord.PersonType, role, StringComparison.OrdinalIgnoreCase))
            {
                return (null, $"This ID is registered as a {universityRecord.PersonType} with the university. Please use the {universityRecord.PersonType} signup form.");
            }

            // The university ID alone isn't proof of identity -- name and email must match
            // what the university has on file for that ID too, or anyone who guesses/finds
            // someone else's ID could register an account under it with fake details.
            if (!string.Equals(universityRecord.FirstName.Trim(), request.FirstName.Trim(), StringComparison.OrdinalIgnoreCase) ||
                !string.Equals(universityRecord.LastName.Trim(), request.LastName.Trim(), StringComparison.OrdinalIgnoreCase) ||
                !string.Equals(universityRecord.Email.Trim(), request.Email.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                return (null, "Your first name, last name, and email must match the university's records for this ID.");
            }

            var email = request.Email.Trim().ToLowerInvariant();
            if (await _userRepository.EmailExistsAsync(email))
            {
                return (null, "An account with this email already exists.");
            }

            if (await _userRepository.UniversityIdExistsAsync(universityRecord.Id))
            {
                return (null, "An account already exists for this university ID.");
            }

            string? plateNumber = null;

            // Students must register a vehicle at signup; workers never have one at all.
            if (role == UserRoles.Student)
            {
                if (request.ModelId is null || string.IsNullOrWhiteSpace(request.PlateNumber))
                {
                    return (null, "Vehicle model and plate number are required to sign up as a student.");
                }

                var modelDetails = await _vehicleReferenceRepository.GetModelDetailsByIdAsync(request.ModelId.Value);
                if (modelDetails is null)
                {
                    return (null, "Invalid vehicle model selected.");
                }

                plateNumber = request.PlateNumber.Trim().ToUpperInvariant();
                if (await _vehicleRepository.PlateNumberExistsAsync(plateNumber))
                {
                    return (null, "This plate number is already registered.");
                }
            }

            var passwordHash = _passwordHasher.HashPassword(request.Password);
            var qrToken = Guid.NewGuid().ToString("N");

            var user = new UserAccount
            {
                UniversityId = universityRecord.Id,
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim(),
                Email = email,
                PasswordHash = passwordHash,
                Role = role,
                QrToken = qrToken
            };

            int newUserId;

            if (role == UserRoles.Student)
            {
                var vehicle = new Vehicle
                {
                    ModelId = request.ModelId!.Value,
                    PlateNumber = plateNumber!,
                    Year = request.Year,
                    Color = request.Color?.Trim(),
                    IsPrimary = true
                };

                (newUserId, _) = await _userRepository.CreateUserWithVehicleAsync(user, vehicle);
            }
            else
            {
                newUserId = await _userRepository.CreateUserAsync(user);
            }

            return (new SignupResponse
            {
                Id = newUserId,
                FirstName = user.FirstName,
                Role = user.Role,
                QrToken = qrToken
            }, null);
        }

        public async Task<LoginResponse?> LoginAsync(LoginRequest request)
        {
            var email = request.Email.Trim().ToLowerInvariant();
            var user = await _userRepository.GetByEmailAsync(email);

            if (user is null)
            {
                return null;
            }

            if (!_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            {
                return null;
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Email),
                new Claim(JwtRegisteredClaimNames.Sub, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                // Used later by [Authorize(Roles = "student")] etc. on protected endpoints.
                new Claim(ClaimTypes.Role, user.Role)
            };

            var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
            var signingCredentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
            var expiresAtUtc = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationMinutes);

            var token = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: expiresAtUtc,
                signingCredentials: signingCredentials);

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            return new LoginResponse
            {
                Id = user.Id,
                Token = tokenString,
                ExpiresAtUtc = expiresAtUtc,
                FirstName = user.FirstName,
                Role = user.Role
            };
        }
        public async Task<MeResponse?> GetMeAsync(int userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user is null)
            {
                return null;
            }

            return new MeResponse
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Role = user.Role,
                Points = user.Points,
                Status = user.Status,
                QrToken = user.QrToken
            };
        }

        public async Task<(bool Success, string? ErrorMessage)> ResetForgottenPasswordAsync(ForgotPasswordRequest request)
        {
            var email = request.Email.Trim().ToLowerInvariant();
            var user = await _userRepository.GetByEmailAsync(email);
            if (user is null)
            {
                return (false, "No account found with this email.");
            }

            var universityRecord = await _universityRepository.GetByStoredIdAsync(request.StoredId.Trim());
            if (universityRecord is null || user.UniversityId != universityRecord.Id)
            {
                // Deliberately vague -- don't reveal whether the email or the ID was the wrong one.
                return (false, "This email and university ID don't match any account.");
            }

            var newHash = _passwordHasher.HashPassword(request.NewPassword);
            await _userRepository.UpdatePasswordAsync(user.Id, newHash);
            return (true, null);
        }
    }
}