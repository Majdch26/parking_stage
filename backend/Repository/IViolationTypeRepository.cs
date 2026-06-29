using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Repository
{
    public interface IViolationTypeRepository
    {
        Task<bool> CodeExistsAsync(string code);
        Task<int> CreateAsync(ViolationType violationType);
        Task<IEnumerable<ViolationType>> GetAllAsync();
        /// <summary>Looks up a violation type by its code (e.g. "no_scan") instead of a hardcoded id, since admin could delete/recreate types.</summary>
        Task<ViolationType?> GetByCodeAsync(string code);
        /// <summary>Types a worker is allowed to manually select -- excludes system-only automatic types (no_scan, wrong_slot).</summary>
        Task<IEnumerable<ViolationType>> GetManuallyAssignableTypesAsync();
        Task<bool> UpdateAsync(int id, string? description, int points);

        /// <summary>Deletes a violation type -- fails (returns false) if it's still referenced by existing violations.</summary>
        Task<bool> DeleteAsync(int id);
    }
}