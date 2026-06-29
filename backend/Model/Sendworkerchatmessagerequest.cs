namespace ParkingUniversitySystem.Model
{
    /// <summary>Body for POST /WorkerChat/messages.</summary>
    public class SendWorkerChatMessageRequest
    {
        public string Message { get; set; } = string.Empty;
    }
}