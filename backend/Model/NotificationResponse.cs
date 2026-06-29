namespace ParkingUniversitySystem.Model
{
    /// <summary>Returned when a user checks their own notifications.</summary>
    public class NotificationResponse
    {
        public int Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        public int? RelatedId { get; set; }
    }
}