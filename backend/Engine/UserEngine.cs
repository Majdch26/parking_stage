using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;
using ParkingUniversitySystem.Security;

namespace ParkingUniversitySystem.Engine
{
    public class UserEngine : IUserEngine
    {
        private readonly IUserRepository _userRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IPasswordHasher _passwordHasher;

        public UserEngine(IUserRepository userRepository, INotificationRepository notificationRepository, IPasswordHasher passwordHasher)
        {
            _userRepository = userRepository;
            _notificationRepository = notificationRepository;
            _passwordHasher = passwordHasher;
        }

        public Task<IEnumerable<UserSummaryResponse>> GetAllUsersAsync() => _userRepository.GetAllUsersAsync();

        public async Task<(bool Success, string? ErrorMessage)> UnbanAsync(int userId)
        {
            var unbanned = await _userRepository.UnbanAsync(userId);
            if (!unbanned)
            {
                return (false, "User not found, or is not currently banned.");
            }

            await _notificationRepository.CreateAsync(
                userId, null, "violation", "Your account has been unbanned by an administrator. Your points have been reset to 0.");

            return (true, null);
        }

        public async Task<(bool Success, string? ErrorMessage)> BanAsync(int userId)
        {
            var banned = await _userRepository.BanAsync(userId);
            if (!banned)
            {
                return (false, "User not found, or cannot be banned (e.g. an admin account).");
            }

            await _notificationRepository.CreateAsync(
                userId, null, "violation", "Your account has been blocked by an administrator.");

            return (true, null);
        }

        public async Task<(bool Success, string? ErrorMessage)> UpdateUserAsync(int userId, UpdateUserRequest request)
        {
            var updated = await _userRepository.UpdateBasicInfoAsync(userId, request.FirstName.Trim(), request.LastName.Trim(), request.Email.Trim().ToLowerInvariant());
            if (!updated)
            {
                return (false, "User not found.");
            }
            return (true, null);
        }

        public async Task<(bool Success, string? ErrorMessage)> ResetPasswordAsync(int userId, string newPassword)
        {
            var hash = _passwordHasher.HashPassword(newPassword);
            var updated = await _userRepository.UpdatePasswordAsync(userId, hash);
            if (!updated)
            {
                return (false, "User not found.");
            }
            return (true, null);
        }
    }
}