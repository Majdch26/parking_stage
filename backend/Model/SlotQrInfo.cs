namespace ParkingUniversitySystem.Model
{
    /// <summary>Admin-only -- a slot's identity plus its scan token, used to render/print a QR sticker.</summary>
    public class SlotQrInfo
    {
        public int Id { get; set; }
        public string SlotNumber { get; set; } = string.Empty;
        public string SlotToken { get; set; } = string.Empty;
    }
}
