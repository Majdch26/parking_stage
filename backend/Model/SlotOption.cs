namespace ParkingUniversitySystem.Model
{
    /// <summary>One pickable slot shown to a student before reserving -- just enough info to choose from.</summary>
    public class SlotOption
    {
        public int Id { get; set; }
        public string SlotNumber { get; set; } = string.Empty;
    }
}
