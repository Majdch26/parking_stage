namespace ParkingUniversitySystem.Model
{
    public class MultipleViolationsResponse
    {
        public List<ViolationResponse> Violations { get; set; } = new();
        public int FinalPointsTotal { get; set; }
        public bool IsBanned { get; set; }
    }
}