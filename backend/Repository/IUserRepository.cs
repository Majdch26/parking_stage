using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Repository
{
    public interface IUserRepository
    {
        Task<bool> EmailExistsAsync(string email);
        Task<bool> UniversityIdExistsAsync(int universityId);
        Task<int> CreateUserAsync(UserAccount user);
        Task<UserAccount?> GetByEmailAsync(string email);
        Task<UserAccount?> GetByIdAsync(int id);
        Task<(int UserId, int VehicleId)> CreateUserWithVehicleAsync(UserAccount user, Vehicle vehicle);
        Task<UserAccount?> GetByQrTokenAsync(string qrToken);

        /// <summary>Used by workers/admin to look up a student's internal id by their university StoredId.</summary>
        Task<UserAccount?> GetByStoredIdAsync(string storedId);
        Task<IEnumerable<UserSummaryResponse>> GetAllUsersAsync();

        /// <summary>Resets points to 0 and status to active -- a clean slate, not a partial fix.</summary>
        Task<bool> UnbanAsync(int userId);
        Task<bool> UpdateBasicInfoAsync(int userId, string firstName, string lastName, string email);
        /// <summary>Manually blocks a user (admin decision, independent of the automatic 100-point ban).</summary>
        Task<bool> BanAsync(int userId);

        Task<bool> UpdatePasswordAsync(int userId, string passwordHash);
    }
}