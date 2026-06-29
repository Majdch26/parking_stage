using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Engine
{
    public interface IViolationEngine
    {
        Task<(ViolationResponse? Success, string? ErrorMessage)> AddViolationAsync(int workerId, AddViolationRequest request);
        Task<IEnumerable<ViolationResponse>> GetMyViolationsAsync(int studentId);
    }
}