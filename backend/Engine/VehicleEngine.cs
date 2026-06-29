using System.Linq;
using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.Engine
{
    public class VehicleEngine : IVehicleEngine
    {
        private readonly IVehicleRepository _vehicleRepository;
        private readonly IVehicleReferenceRepository _referenceRepository;

        public VehicleEngine(IVehicleRepository vehicleRepository, IVehicleReferenceRepository referenceRepository)
        {
            _vehicleRepository = vehicleRepository;
            _referenceRepository = referenceRepository;
        }

        public Task<IEnumerable<Brand>> GetBrandsAsync() => _referenceRepository.GetAllBrandsAsync();

        public Task<IEnumerable<ModelResponse>> GetModelsByBrandAsync(int brandId) =>
            _referenceRepository.GetModelsByBrandIdAsync(brandId);

        public Task<IEnumerable<VehicleResponse>> GetMyVehiclesAsync(int userId) =>
            _vehicleRepository.GetByUserIdAsync(userId);

        public async Task<(VehicleResponse? Success, string? ErrorMessage)> RegisterVehicleAsync(int userId, VehicleRegistrationRequest request)
        {
            var modelDetails = await _referenceRepository.GetModelDetailsByIdAsync(request.ModelId);

            if (modelDetails is null)
            {
                return (null, "Invalid model selected.");
            }

            var plateNumber = request.PlateNumber.Trim().ToUpperInvariant();

            if (await _vehicleRepository.PlateNumberExistsAsync(plateNumber))
            {
                return (null, "This plate number is already registered.");
            }

            if (request.IsPrimary)
            {
                await _vehicleRepository.ClearPrimaryForUserAsync(userId);
            }

            var vehicle = new Vehicle
            {
                UserId = userId,
                ModelId = request.ModelId,
                PlateNumber = plateNumber,
                Year = request.Year,
                Color = request.Color?.Trim(),
                IsPrimary = request.IsPrimary
            };

            var newVehicleId = await _vehicleRepository.CreateVehicleAsync(vehicle);

            return (new VehicleResponse
            {
                Id = newVehicleId,
                PlateNumber = plateNumber,
                Year = vehicle.Year,
                Color = vehicle.Color,
                IsPrimary = vehicle.IsPrimary,
                Status = "active",
                BrandName = modelDetails.BrandName,
                ModelName = modelDetails.ModelName,
                VehicleTypeName = modelDetails.VehicleTypeName
            }, null);
        }

        public async Task<(bool Success, string? ErrorMessage)> RemoveVehicleAsync(int userId, int vehicleId)
        {
            var myVehicles = await _vehicleRepository.GetByUserIdAsync(userId);
            if (!myVehicles.Any(v => v.Id == vehicleId))
            {
                return (false, "This vehicle does not belong to your account.");
            }

            await _vehicleRepository.DeactivateAsync(vehicleId);
            return (true, null);
        }

        public async Task<(bool Success, string? ErrorMessage)> SetPrimaryVehicleAsync(int userId, int vehicleId)
        {
            var myVehicles = await _vehicleRepository.GetByUserIdAsync(userId);
            if (!myVehicles.Any(v => v.Id == vehicleId))
            {
                return (false, "This vehicle does not belong to your account.");
            }

            await _vehicleRepository.SetPrimaryAsync(vehicleId, userId);
            return (true, null);
        }
    }
}