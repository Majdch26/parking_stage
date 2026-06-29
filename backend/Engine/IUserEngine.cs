using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Engine
{
    public interface IUserEngine
    {
        Task<IEnumerable<UserSummaryResponse>> GetAllUsersAsync();
        Task<(bool Success, string? ErrorMessage)> UnbanAsync(int userId);
        Task<(bool Success, string? ErrorMessage)> UpdateUserAsync(int userId, UpdateUserRequest request);
        Task<(bool Success, string? ErrorMessage)> BanAsync(int userId);
        Task<(bool Success, string? ErrorMessage)> ResetPasswordAsync(int userId, string newPassword);
    }
}