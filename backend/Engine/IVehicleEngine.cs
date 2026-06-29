using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Engine
{
    /// <summary>
    /// Business logic for vehicle registration -- validates the chosen model exists,
    /// rejects duplicate plates, and ties every new vehicle to whoever is logged in.
    /// </summary>
    public interface IVehicleEngine
    {
        Task<IEnumerable<Brand>> GetBrandsAsync();
        Task<IEnumerable<ModelResponse>> GetModelsByBrandAsync(int brandId);
        Task<(VehicleResponse? Success, string? ErrorMessage)> RegisterVehicleAsync(int userId, VehicleRegistrationRequest request);
        Task<IEnumerable<VehicleResponse>> GetMyVehiclesAsync(int userId);

        Task<(bool Success, string? ErrorMessage)> RemoveVehicleAsync(int userId, int vehicleId);
        Task<(bool Success, string? ErrorMessage)> SetPrimaryVehicleAsync(int userId, int vehicleId);
    }
}