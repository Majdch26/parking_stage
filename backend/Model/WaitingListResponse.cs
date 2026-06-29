namespace ParkingUniversitySystem.Model
{
    public class WaitingListResponse
    {
        public int Id { get; set; }
        public TimeSpan PriorityTime { get; set; }
        public DateTime JoinedAt { get; set; }
        public string Status { get; set; } = string.Empty;
       
    }
}