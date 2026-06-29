using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Engine
{
    public interface IViolationTypeEngine
    {
        Task<(bool Success, string? ErrorMessage)> CreateAsync(CreateViolationTypeRequest request);
        Task<IEnumerable<ViolationType>> GetAllAsync();
        Task<IEnumerable<ViolationType>> GetManuallyAssignableTypesAsync();
        Task<(bool Success, string? ErrorMessage)> UpdateAsync(int id, UpdateViolationTypeRequest request);
        Task<(bool Success, string? ErrorMessage)> DeleteAsync(int id);
    }
}