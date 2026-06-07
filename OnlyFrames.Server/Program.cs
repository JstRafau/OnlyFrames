using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.FileProviders;
using OnlyFrames.Server.Endpoints;
using OnlyFrames.Server.Infrastructure;
using OnlyFrames.Server.Models;

await FFmpegSetup.InitializeAsync();
var builder = WebApplication.CreateBuilder(args);
builder.AddNpgsqlDbContext<AppDbContext>("appdb");

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins("https://localhost")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddAuthorization();
builder.Services.AddIdentityApiEndpoints<ApplicationUser>().AddEntityFrameworkStores<AppDbContext>();
builder.Services.AddSingleton<TranscodingService>();
builder.Services.AddSingleton<TranscodeQueue>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<TranscodeQueue>());

builder.Services.Configure<KestrelServerOptions>(options =>
{
    options.Limits.MaxRequestBodySize = 524288000;
});
builder.Services.Configure<FormOptions>(options =>
{
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartBodyLengthLimit = 524288000;
    options.MemoryBufferThreshold = int.MaxValue;
});

var app = builder.Build();

app.UseHttpsRedirection();
app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();

var mediaPath = Path.Combine(Directory.GetCurrentDirectory(), "media");
var avatarsPath = Path.Combine(mediaPath, "avatars");
var videosPath = Path.Combine(mediaPath, "videos");
var captionsPath = Path.Combine(mediaPath, "captions");

if (!Directory.Exists(avatarsPath)) Directory.CreateDirectory(avatarsPath);
if (!Directory.Exists(videosPath)) Directory.CreateDirectory(videosPath);
if (!Directory.Exists(captionsPath)) Directory.CreateDirectory(captionsPath);

var targetDefaultAvatar = Path.Combine(avatarsPath, "default_avatar.png");
try
{
    if (!File.Exists(targetDefaultAvatar))
    {
        var sourceDefaultAvatar = Path.Combine(AppContext.BaseDirectory, "Assets", "default_avatar.png");
        if (File.Exists(sourceDefaultAvatar))
        {
            File.Copy(sourceDefaultAvatar, targetDefaultAvatar);
        }
    }
}
catch (Exception ex)
{
    Console.WriteLine($"--> OSTRZEŻENIE: Nie można skopiować domyślnego awatara. Zignorowano. Szczegóły: {ex.Message}");
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(avatarsPath),
    RequestPath = "/api/avatars"
});
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(videosPath),
    RequestPath = "/videos"
});
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(captionsPath),
    RequestPath = "/captions"
});

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // dbContext.Database.EnsureDeleted();

    dbContext.Database.EnsureCreated(); 
}

app.MapRegisterEndpoints();
app.MapLoginEndpoints();
app.MapProfileEndpoints();
app.MapVideoEndpoints();
app.MapStreamEndpoints();

app.Run();