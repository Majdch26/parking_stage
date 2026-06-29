namespace ParkingUniversitySystem.Model
{
    /// <summary>One existing active reservation window on a slot for a given date -- shown to a
    /// student picking that slot so they can see "A1 is reserved 13:00-15:00" and pick a free time.</summary>
    public class ReservationWindowResponse
    {
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
    }
}