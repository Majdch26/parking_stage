using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Repository
{
    public interface IUniversityRepository
    {
        Task<UniversityRecord?> GetByStoredIdAsync(string storedId);
    }
}
