namespace ParkingUniversitySystem.Model
{
    /// <summary>One row in the live queue view -- anonymized except for the requesting student themself.</summary>
    public class WaitingQueueItem
    {
        public int Position { get; set; }
        public TimeSpan PriorityTime { get; set; }
        public bool IsMe { get; set; }
    }
}