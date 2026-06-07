using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using OnlyFrames.Server.Models;

namespace OnlyFrames.Server.Endpoints;
/// <summary>
/// Provides extension methods for mapping user profile management endpoints.
/// </summary>

public static class ProfileEndpoints
{
    /// <summary>
    /// Maps secure profile operations such as password changes and avatar management.
    /// All endpoints mapped within this group require active bearer authorization.
    /// </summary>
    /// <param name="app">The endpoint route builder.</param>
    public static void MapProfileEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/profile").RequireAuthorization();

        // 1. POBIERANIE DANYCH
        group.MapGet("/info", async (ClaimsPrincipal userPrincipal, UserManager<ApplicationUser> userManager) =>
        {
            var user = await userManager.GetUserAsync(userPrincipal);
            if (user == null) return Results.Unauthorized();

            var avatarFolder = Path.Combine(Directory.GetCurrentDirectory(), "media", "avatars");

            var existingFiles = Directory.Exists(avatarFolder)
                ? Directory.GetFiles(avatarFolder, $"{user.Id}.*")
                : Array.Empty<string>();

            // Tutaj jest nowe /api/avatars
            var avatarUrl = existingFiles.Length > 0
                ? $"/api/avatars/{Path.GetFileName(existingFiles[0])}"
                : null;

            return Results.Ok(new { Username = user.UserName, AvatarUrl = avatarUrl });
        });

        // 2. ZMIANA NICKU
        group.MapPost("/change-username", async (ChangeUsernameDto model, ClaimsPrincipal userPrincipal, UserManager<ApplicationUser> userManager) =>
        {
            var user = await userManager.GetUserAsync(userPrincipal);
            if (user == null) return Results.Unauthorized();

            var existingUser = await userManager.FindByNameAsync(model.NewUsername);
            if (existingUser != null) return Results.BadRequest(new { Message = "Ta nazwa użytkownika jest już zajęta." });

            var result = await userManager.SetUserNameAsync(user, model.NewUsername);
            if (!result.Succeeded) return Results.BadRequest(result.Errors);

            return Results.Ok(new { Message = "Nazwa zmieniona pomyślnie." });
        });

        // 3. ZMIANA HASŁA
        group.MapPost("/change-password", async (ChangePasswordDto model, ClaimsPrincipal userPrincipal, UserManager<ApplicationUser> userManager) =>
        {
            var user = await userManager.GetUserAsync(userPrincipal);
            if (user == null) return Results.Unauthorized();

            var result = await userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
            if (!result.Succeeded) return Results.BadRequest(result.Errors);

            return Results.Ok(new { Message = "Hasło zmienione pomyślnie." });
        });

        // 4. WGRYWANIE AWATARA
        group.MapPost("/avatar", async (IFormFile file, ClaimsPrincipal userPrincipal, UserManager<ApplicationUser> userManager) =>
        {
            var user = await userManager.GetUserAsync(userPrincipal);
            if (user == null) return Results.Unauthorized();
            if (file == null || file.Length == 0) return Results.BadRequest("Nie wybrano pliku.");

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(extension))
                return Results.BadRequest(new { Message = "Tylko pliki JPG, PNG i WEBP są dozwolone." });

            var avatarFolder = Path.Combine(Directory.GetCurrentDirectory(), "media", "avatars");

            if (!Directory.Exists(avatarFolder)) Directory.CreateDirectory(avatarFolder);

            var newFileName = $"{user.Id}{extension}";
            var fullPath = Path.Combine(avatarFolder, newFileName);

            var existingFiles = Directory.GetFiles(avatarFolder, $"{user.Id}.*");
            foreach (var existingFile in existingFiles) File.Delete(existingFile);

            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Tutaj jest dodane /api i zamknięte wszystkie nawiasy!
            return Results.Ok(new { Message = "Awatar zaktualizowany.", AvatarUrl = $"/api/avatars/{newFileName}" });
        }).DisableAntiforgery();
    }
}