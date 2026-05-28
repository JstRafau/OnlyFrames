using Microsoft.Extensions.FileProviders;
using OnlyFrames.Server.Endpoints;
using OnlyFrames.Server.Models;
using Microsoft.AspNetCore.Http.Features;


var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options => { options.Limits.MaxRequestBodySize = 524288000; });

builder.Services.Configure<FormOptions>(options => { options.MultipartBodyLengthLimit = 524288000; });

builder.AddNpgsqlDbContext<AppDbContext>("appdb");

builder.Services.AddAuthorization();
builder.Services.AddIdentityApiEndpoints<ApplicationUser>()
    .AddEntityFrameworkStores<AppDbContext>();

var app = builder.Build();

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

var avatarsPath = "/media/avatars";
var videosPath = "/media/videos";
var captionsPath = "/media/captions";

if (!Directory.Exists(avatarsPath)) Directory.CreateDirectory(avatarsPath);
if (!Directory.Exists(videosPath)) Directory.CreateDirectory(videosPath);
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

var thumbnailsPath = "/media/thumbnails";
if (!Directory.Exists(thumbnailsPath)) Directory.CreateDirectory(thumbnailsPath);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(thumbnailsPath),
    RequestPath = "/thumbnails"
});

app.MapRegisterEndpoints();
app.MapLoginEndpoints();
app.MapProfileEndpoints();
app.MapVideoEndpoints();

app.Run();