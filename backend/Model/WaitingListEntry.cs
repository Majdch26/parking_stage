namespace ParkingUniversitySystem.Model
{
    /// <summary>Maps to one row of the waiting_list table.</summary>
    public class WaitingListEntry
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int VehicleId { get; set; }
        public int? AreaId { get; set; }
        public TimeSpan PriorityTime { get; set; }
        public DateTime JoinedAt { get; set; }

        /// <summary>One of: waiting, notified, fulfilled, cancelled.</summary>
        public string Status { get; set; } = "waiting";

        public int? OfferedSlotId { get; set; }
        public DateTime? NotifiedAt { get; set; }
        public DateTime? FulfilledAt { get; set; }
        public DateTime? ExpiredAt { get; set; }
        public DateTime? TimePassedNotifiedAt { get; set; }
    }
}