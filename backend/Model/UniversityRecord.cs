namespace ParkingUniversitySystem.Model
{
    /// <summary>
    /// Maps to one row of the university table -- the pre-loaded list of valid
    /// student/worker identities used to validate signup, supplied by the university itself.
    /// </summary>
    public class UniversityRecord
    {
        public int Id { get; set; }
        public string StoredId { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        /// <summary>One of: student, worker.</summary>
        public string PersonType { get; set; } = string.Empty;
    }
}
