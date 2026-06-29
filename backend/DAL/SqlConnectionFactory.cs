using Microsoft.Data.SqlClient;

namespace ParkingUniversitySystem.DAL
{
    public interface ISqlConnectionFactory
    {
        SqlConnection CreateConnection();
    }

    public class SqlConnectionFactory : ISqlConnectionFactory
    {
        private readonly string _connectionString;

        public SqlConnectionFactory(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("Cnx")
                ?? throw new InvalidOperationException(
                    "Connection string 'Cnx' is missing. Add it under ConnectionStrings in appsettings.json.");
        }

        public SqlConnection CreateConnection()
        {
            return new SqlConnection(_connectionString);
        }
    }
}