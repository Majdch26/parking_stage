
using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Engine
{
    public interface IParkingSessionEngine
    {
        Task<(EntryResponse? Success, string? ErrorMessage)> EnterAsync(string qrToken);
        Task<(SlotScanResponse? Success, string? ErrorMessage)> ScanSlotAsync(SlotScanRequest request);
        /// <summary>Logged-in student scans the slot sticker themselves -- identity from the JWT, not a QR.</summary>
        Task<(SlotScanResponse? Success, string? ErrorMessage)> ScanMySlotAsync(int userId, string slotToken);
        Task<SessionStatusResponse?> GetMySessionAsync(int userId);
        Task<(ExitResponse? Success, string? ErrorMessage)> ExitAsync(string qrToken);
        Task<int?> GetActiveSessionIdAsync(int userId);
        Task<IEnumerable<SessionHistoryItem>> GetHistoryAsync(int userId);
        Task ClearHistoryAsync(int userId);
    }
}