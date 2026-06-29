using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.Engine
{
    public class ViolationTypeEngine : IViolationTypeEngine
    {
        private readonly IViolationTypeRepository _repository;

        public ViolationTypeEngine(IViolationTypeRepository repository)
        {
            _repository = repository;
        }

        public async Task<(bool Success, string? ErrorMessage)> CreateAsync(CreateViolationTypeRequest request)
        {
            var code = request.Code.Trim().ToLowerInvariant();

            if (await _repository.CodeExistsAsync(code))
            {
                return (false, "A violation type with this code already exists.");
            }

            var violationType = new ViolationType
            {
                Code = code,
                Description = request.Description,
                Points = request.Points
            };

            await _repository.CreateAsync(violationType);
            return (true, null);
        }

        public Task<IEnumerable<ViolationType>> GetAllAsync() => _repository.GetAllAsync();
        public Task<IEnumerable<ViolationType>> GetManuallyAssignableTypesAsync() =>
    _repository.GetManuallyAssignableTypesAsync();
        public async Task<(bool Success, string? ErrorMessage)> UpdateAsync(int id, UpdateViolationTypeRequest request)
        {
            var updated = await _repository.UpdateAsync(id, request.Description, request.Points);
            if (!updated)
            {
                return (false, "Violation type not found.");
            }
            return (true, null);
        }

        // These two codes are looked up directly by the engines that auto-assign violations
        // (missed scan, parked in the wrong slot) -- deleting them would break that logic silently.
        private static readonly string[] ProtectedCodes = { "no_scan", "wrong_slot" };

        public async Task<(bool Success, string? ErrorMessage)> DeleteAsync(int id)
        {
            var allTypes = await _repository.GetAllAsync();
            var target = allTypes.FirstOrDefault(t => t.Id == id);
            if (target is null)
            {
                return (false, "Violation type not found.");
            }
            if (ProtectedCodes.Contains(target.Code))
            {
                return (false, "This violation type is used by the system and can't be deleted.");
            }

            var deleted = await _repository.DeleteAsync(id);
            if (!deleted)
            {
                return (false, "This violation type is still used by existing violations and can't be deleted.");
            }
            return (true, null);
        }
    }
}