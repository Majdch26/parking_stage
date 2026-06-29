using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using ParkingUniversitySystem.BackgroundServices;
using ParkingUniversitySystem.DAL;
using ParkingUniversitySystem.Engine;
using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;
using ParkingUniversitySystem.Security;
using ParkingUniversitySystem.Seeding;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));

var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>()
    ?? throw new InvalidOperationException("JwtSettings section is missing from appsettings.json.");

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidateAudience = true,
        ValidAudience = jwtSettings.Audience,
        ValidateLifetime = true,
        RoleClaimType = ClaimTypes.Role,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Enter JWT token. Example: paste the token value only (Swagger adds 'Bearer' prefix).",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});

// --- DAL infrastructure ---
builder.Services.AddSingleton<ISqlConnectionFactory, SqlConnectionFactory>();

// --- Security ---
builder.Services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();
//---background service---
builder.Services.AddHostedService<ScanDeadlineBackgroundService>();
builder.Services.AddHostedService<WorkerScheduleReminderBackgroundService>();

// --- Repository layer ---
builder.Services.AddScoped<IUniversityRepository, UniversityRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IVehicleReferenceRepository, VehicleReferenceRepository>();
builder.Services.AddScoped<IVehicleRepository, VehicleRepository>();
builder.Services.AddScoped<IParkingRepository, ParkingRepository>();
builder.Services.AddScoped<IReservationRepository, ReservationRepository>();
builder.Services.AddScoped<IParkingSessionRepository, ParkingSessionRepository>();
builder.Services.AddScoped<ISlotScanRepository, SlotScanRepository>();
builder.Services.AddScoped<IViolationTypeRepository, ViolationTypeRepository>();
builder.Services.AddScoped<IViolationRepository, ViolationRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IWorkerShiftRepository, WorkerShiftRepository>();
builder.Services.AddScoped<IAssistanceRepository, AssistanceRepository>();
builder.Services.AddScoped<IWaitingListRepository, WaitingListRepository>();
builder.Services.AddScoped<IActivityLogRepository, ActivityLogRepository>();
builder.Services.AddScoped<IWorkerScheduleRepository, WorkerScheduleRepository>();
builder.Services.AddScoped<IWorkerChatRepository, WorkerChatRepository>();

// --- Engine layer ---
builder.Services.AddScoped<IAuthEngine, AuthEngine>();
builder.Services.AddScoped<IVehicleEngine, VehicleEngine>();
builder.Services.AddScoped<IParkingEngine, ParkingEngine>();
builder.Services.AddScoped<IReservationEngine, ReservationEngine>();
builder.Services.AddScoped<IParkingSessionEngine, ParkingSessionEngine>();
builder.Services.AddScoped<IViolationTypeEngine, ViolationTypeEngine>();
builder.Services.AddScoped<IViolationEngine, ViolationEngine>();
builder.Services.AddScoped<INotificationEngine, NotificationEngine>();
builder.Services.AddScoped<IWorkerShiftEngine, WorkerShiftEngine>();
builder.Services.AddScoped<IAssistanceEngine, AssistanceEngine>();
builder.Services.AddScoped<IWaitingListEngine, WaitingListEngine>();
builder.Services.AddScoped<IActivityLogEngine, ActivityLogEngine>();
builder.Services.AddScoped<IUserEngine, UserEngine>();
builder.Services.AddHttpClient<IChatEngine, ChatEngine>();
builder.Services.AddScoped<IWorkerScheduleEngine, WorkerScheduleEngine>();
builder.Services.AddScoped<IWorkerChatEngine, WorkerChatEngine>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var violationTypeRepository = scope.ServiceProvider.GetRequiredService<IViolationTypeRepository>();
    await DatabaseSeeder.SeedViolationTypesAsync(violationTypeRepository);
}


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "ParkingUniversitySystem API V1");
    });
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();