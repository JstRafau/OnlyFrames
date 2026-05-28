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

        group.MapPost("/change-password",
            async (ChangePasswordDto model, ClaimsPrincipal userPrincipal, UserManager<ApplicationUser> userManager) =>
            {
                var user = await userManager.GetUserAsync(userPrincipal);
                if (user == null) return Results.Unauthorized();

                var result = await userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
                if (!result.Succeeded) return Results.BadRequest(result.Errors);

                return Results.Ok(new { Message = "Password changed successfully." });
            });

        group.MapPost("/avatar",
            async (IFormFile file, ClaimsPrincipal userPrincipal, UserManager<ApplicationUser> userManager) =>
            {
                var user = await userManager.GetUserAsync(userPrincipal);
                if (user == null) return Results.Unauthorized();
                if (file == null || file.Length == 0) return Results.BadRequest("No file was uploaded.");

                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

                if (!allowedExtensions.Contains(extension))
                {
                    return Results.BadRequest(new
                        { Message = "Invalid file type. Only JPG, PNG, and WEBP formats are allowed." });
                }

                var avatarFolder = "/media/avatars";
                if (!Directory.Exists(avatarFolder)) Directory.CreateDirectory(avatarFolder);

                var newFileName = $"{user.UserName}{extension}";
                var fullPath = Path.Combine(avatarFolder, newFileName);

                var existingFiles = Directory.GetFiles(avatarFolder, $"{user.UserName}.*");
                foreach (var existingFile in existingFiles) File.Delete(existingFile);

                using (var stream = new FileStream(fullPath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                return Results.Ok(new
                    { Message = "Avatar updated successfully.", AvatarUrl = $"/avatars/{newFileName}" });
            }).DisableAntiforgery();

        group.MapDelete("/avatar",
            async (ClaimsPrincipal userPrincipal, UserManager<ApplicationUser> userManager) =>
            {
                var user = await userManager.GetUserAsync(userPrincipal);
                if (user == null) return Results.Unauthorized();

                var avatarFolder = "/media/avatars";

                if (!Directory.Exists(avatarFolder))
                    return Results.Ok(new { Message = "Avatar removed successfully." });

                var existingFiles = Directory.GetFiles(avatarFolder, $"{user.UserName}.*");

                if (existingFiles.Length == 0)
                {
                    return Results.Ok(new { Message = "No avatar found to remove." });
                }

                foreach (var existingFile in existingFiles)
                {
                    File.Delete(existingFile);
                }

                return Results.Ok(new { Message = "Avatar removed successfully." });
            });
    }
}