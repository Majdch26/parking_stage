using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Repository
{
    /// <summary>Read-only lookups powering the brand → model cascading dropdown.</summary>
    public interface IVehicleReferenceRepository
    {
        Task<IEnumerable<Brand>> GetAllBrandsAsync();

        /// <summary>Models for one chosen brand -- includes vehicle type name for auto-fill.</summary>
        Task<IEnumerable<ModelResponse>> GetModelsByBrandIdAsync(int brandId);

        /// <summary>Used by VehicleEngine to validate ModelId and to denormalize the response. Null if ModelId doesn't exist.</summary>
        Task<VehicleModelDetails?> GetModelDetailsByIdAsync(int modelId);
    }
}