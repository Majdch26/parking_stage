using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Repository
{
    public interface IVehicleRepository
    {
        /// <summary>Plates are unique system-wide, checked before insert.</summary>
        Task<bool> PlateNumberExistsAsync(string plateNumber);

        /// <summary>Called before inserting a new primary vehicle, so a student only ever has one.</summary>
        Task ClearPrimaryForUserAsync(int userId);

        Task<int> CreateVehicleAsync(Vehicle vehicle);

        /// <summary>All vehicles belonging to one user, denormalized with brand/model/type names.</summary>
        Task<IEnumerable<VehicleResponse>> GetByUserIdAsync(int userId);

        Task DeactivateAsync(int vehicleId);
        Task SetPrimaryAsync(int vehicleId, int userId);
    }
}