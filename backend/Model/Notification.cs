namespace ParkingUniversitySystem.Model
{
    /// <summary>Maps to one row of the notification table.</summary>
    public class Notification
    {
        public int Id { get; set; }
        public int ReceiverId { get; set; }
        public int? SenderId { get; set; }

        /// <summary>One of: reservation, assistance, waiting_list, violation, scan_reminder, wrong_slot.</summary>
        public string Type { get; set; } = string.Empty;

        public string Message { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        public int? RelatedId { get; set; }
    }
}