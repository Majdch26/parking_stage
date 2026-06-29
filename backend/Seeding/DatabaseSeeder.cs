using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.Seeding
{
    /// <summary>One-time startup data seeding -- kept separate so Program.cs stays focused on app configuration only.</summary>
    public static class DatabaseSeeder
    {
        public static async Task SeedViolationTypesAsync(IViolationTypeRepository repository)
        {
            var existingTypes = await repository.GetAllAsync();
            if (existingTypes.Any())
            {
                return;
            }

            var defaults = new[]
            {
                new ViolationType { Code = "bad_parking", Description = "Bad parking", Points = 10 },
                new ViolationType { Code = "very_bad_parking", Description = "Very bad parking", Points = 20 },
                new ViolationType { Code = "no_scan", Description = "Did not scan the parking slot within the allowed time", Points = 20 },
                new ViolationType { Code = "accident", Description = "Caused an accident", Points = 20 },
                new ViolationType { Code = "wrong_slot", Description = "Parked in the wrong slot and did not correct it in time", Points = 20 },
                
            };

            foreach (var type in defaults)
            {
                await repository.CreateAsync(type);
            }
        }
    }
}