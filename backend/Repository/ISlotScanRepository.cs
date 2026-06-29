using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Repository
{
    public interface ISlotScanRepository
    {
        Task<ParkingSlot?> GetSlotByTokenAsync(string slotToken);

        /// <summary>Records a failed scan attempt only -- session and slot status stay unchanged.</summary>
        Task RecordFailedScanAsync(int sessionId, int slotId, string status);

        /// <summary>
        /// Records a successful scan and, in the same transaction, marks the session
        /// 'parked' and the slot 'occupied'.
        /// </summary>
        Task RecordSuccessfulScanAsync(int sessionId, int slotId, string status);
        Task<string?> GetSlotNumberByIdAsync(int slotId);
        /// <summary>
        /// Sessions whose most recent scan was 'wrong_slot', 15+ minutes ago, where no valid
        /// scan has happened since, and no wrong_slot violation has been issued yet for this incident.
        /// </summary>
        Task<IEnumerable<SlotScan>> GetUncorrectedWrongSlotScansAsync();
    }
}