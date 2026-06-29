namespace ParkingUniversitySystem.Model
{
    /// <summary>One message in the worker group chat.</summary>
    public class WorkerChatMessageResponse
    {
        public int Id { get; set; }
        public int SenderId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}