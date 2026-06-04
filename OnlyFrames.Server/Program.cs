using Microsoft.Extensions.FileProviders;
using OnlyFrames.Server.Endpoints;
using OnlyFrames.Server.Models;


var builder = WebApplication.CreateBuilder(args);

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
    // Jeśli Docker zablokuje dostęp, wypiszemy tylko błąd w logach, ale NIE ZABIJEMY API!
    Console.WriteLine($"--> OSTRZEŻENIE: Nie można skopiować domyślnego awatara. Zignorowano. Szczegóły: {ex.Message}");
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
// Automatyczne aplikowanie zmian w bazie przy uruchomieniu
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // To polecenie upewnia się, że baza istnieje i tworzy tabele na podstawie modeli
    dbContext.Database.EnsureCreated();
}

app.MapRegisterEndpoints();
app.MapLoginEndpoints();
app.MapProfileEndpoints();

app.Run();