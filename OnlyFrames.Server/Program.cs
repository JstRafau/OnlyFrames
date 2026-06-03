using Microsoft.Extensions.FileProviders;
using OnlyFrames.Server.Endpoints;
using OnlyFrames.Server.Infrastructure;
using OnlyFrames.Server.Models;


await FFmpegSetup.InitializeAsync();

var builder = WebApplication.CreateBuilder(args);

builder.AddNpgsqlDbContext<AppDbContext>("appdb");


builder.Services.AddAuthorization();
builder.Services.AddIdentityApiEndpoints<ApplicationUser>().AddEntityFrameworkStores<AppDbContext>();
builder.Services.AddSingleton<TranscodingService>();
builder.Services.AddSingleton<TranscodeQueue>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<TranscodeQueue>());

var app = builder.Build();

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

var avatarsPath = "/media/avatars";
var videosPath = "/media/videos";
var captionsPath = "/media/captions";

if (!Directory.Exists(avatarsPath))  Directory.CreateDirectory(avatarsPath);
if (!Directory.Exists(videosPath))   Directory.CreateDirectory(videosPath);
if (!Directory.Exists(captionsPath)) Directory.CreateDirectory(captionsPath);

var targetDefaultAvatar = Path.Combine(avatarsPath, "default_avatar.png");
if (!File.Exists(targetDefaultAvatar))
{
    var sourceDefaultAvatar = Path.Combine(AppContext.BaseDirectory, "Assets", "default_avatar.png");
    if (File.Exists(sourceDefaultAvatar))
    {
        File.Copy(sourceDefaultAvatar, targetDefaultAvatar);
    }
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(avatarsPath),
    RequestPath = "/avatars"
});

app.MapRegisterEndpoints();
app.MapLoginEndpoints();
app.MapProfileEndpoints();
app.MapVideoEndpoints();
app.MapStreamEndpoints();

app.Run();