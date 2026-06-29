using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Engine
{
    public interface IReservationEngine
    {
        Task<(ReservationResponse? Success, string? ErrorMessage)> CreateReservationAsync(int userId, ReservationRequest request);
        Task<(bool Success, string? ErrorMessage)> CancelReservationAsync(int userId, int reservationId);
        Task<IEnumerable<ReservationResponse>> GetMyReservationsAsync(int userId);
        Task<(bool Success, string? ErrorMessage)> UpdateReservationTimeAsync(int userId, int reservationId, ReservationUpdateRequest request);

        /// <summary>Existing active reservation windows on a slot for a date -- shown when a student picks that slot.</summary>
        Task<IEnumerable<ReservationWindowResponse>> GetSlotWindowsAsync(int slotId, DateTime date);
    }
}