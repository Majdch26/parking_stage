using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Repository
{
    public interface IViolationRepository
    {
        Task<ViolationType?> GetViolationTypeByIdAsync(int violationTypeId);

        /// <summary>
        /// Adds points to the student, checks the 100-point ban threshold, and records
        /// the violation -- all in one transaction. Returns the new total points and
        /// whether this specific violation just pushed them over the threshold.
        /// </summary>
        Task<(int NewTotalPoints, bool JustBanned, int ViolationId)> AddViolationAsync(
            int studentId, int? workerId, int violationTypeId, int? sessionId);

        /// <summary>A student's own violation history, most recent first.</summary>
        Task<IEnumerable<ViolationResponse>> GetByStudentIdAsync(int studentId);
    }
}