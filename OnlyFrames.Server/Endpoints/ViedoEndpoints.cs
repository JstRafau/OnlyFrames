using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using OnlyFrames.Server.Models;

namespace OnlyFrames.Server.Endpoints;

/// <summary>
/// Provides extension methods for mapping video management endpoints.
/// </summary>
public static class VideoEndpoints
{
    public static void MapVideoEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/videos").RequireAuthorization();

        group.MapPost("/upload", async (
                [FromForm] string title,
                [FromForm] string? description,
                [FromForm] bool isPublic,
                IFormFile videoFile,
                IFormFile? subtitleFile,
                IFormFile? thumbnailFile,
                ClaimsPrincipal userPrincipal,
                UserManager<ApplicationUser> userManager,
                AppDbContext dbContext) =>
            {
                var user = await userManager.GetUserAsync(userPrincipal);
                if (user == null) return Results.Unauthorized();

                if (videoFile == null || videoFile.Length == 0)
                    return Results.BadRequest("Video file is required.");

                var allowedVideoExt = new[] { ".mp4", ".webm" };
                var videoExt = Path.GetExtension(videoFile.FileName).ToLowerInvariant();
                if (!allowedVideoExt.Contains(videoExt))
                    return Results.BadRequest("Invalid video format. Only MP4 and WEBM are allowed.");

                string? savedSubtitleName = null;
                if (subtitleFile != null && subtitleFile.Length > 0)
                {
                    var subExt = Path.GetExtension(subtitleFile.FileName).ToLowerInvariant();
                    if (subExt != ".vtt") return Results.BadRequest("Subtitles must be in .VTT format.");

                    savedSubtitleName = $"{Guid.NewGuid()}{subExt}";
                    var subPath = Path.Combine("/media/captions", savedSubtitleName);
                    using var stream = new FileStream(subPath, FileMode.Create);
                    await subtitleFile.CopyToAsync(stream);
                }

                string? savedThumbnailName = null;
                if (thumbnailFile != null && thumbnailFile.Length > 0)
                {
                    var allowedThumbExt = new[] { ".jpg", ".jpeg", ".png", ".webp" };
                    var thumbExt = Path.GetExtension(thumbnailFile.FileName).ToLowerInvariant();
                    if (!allowedThumbExt.Contains(thumbExt)) return Results.BadRequest("Invalid thumbnail format.");

                    savedThumbnailName = $"{Guid.NewGuid()}{thumbExt}";
                    var thumbPath = Path.Combine("/media/thumbnails", savedThumbnailName);
                    using var stream = new FileStream(thumbPath, FileMode.Create);
                    await thumbnailFile.CopyToAsync(stream);
                }

                var savedVideoName = $"{Guid.NewGuid()}{videoExt}";
                var videoPath = Path.Combine("/media/videos", savedVideoName);
                using (var stream = new FileStream(videoPath, FileMode.Create))
                {
                    await videoFile.CopyToAsync(stream);
                }

                var newVideo = new Video
                {
                    Title = title,
                    Description = description,
                    IsPublic = isPublic,
                    VideoFileName = savedVideoName,
                    SubtitleFileName = savedSubtitleName,
                    ThumbnailFileName = savedThumbnailName,
                    CreatedAt = DateTime.UtcNow,
                    UserId = user.Id
                };

                dbContext.Videos.Add(newVideo);
                await dbContext.SaveChangesAsync();

                return Results.Ok(new { Message = "Video uploaded successfully.", VideoId = newVideo.Id });
            })
            .DisableAntiforgery();


        group.MapPut("/{id:int}", async (
            int id,
            [FromForm] string title,
            [FromForm] string? description,
            [FromForm] bool isPublic,
            IFormFile? subtitleFile,
            IFormFile? thumbnailFile,
            ClaimsPrincipal userPrincipal,
            UserManager<ApplicationUser> userManager,
            AppDbContext dbContext) =>
        {
            var user = await userManager.GetUserAsync(userPrincipal);
            if (user == null) return Results.Unauthorized();

            var video = await dbContext.Videos.FindAsync(id);
            if (video == null) return Results.NotFound("Video not found.");

            if (video.UserId != user.Id) return Results.Forbid();

            video.Title = title;
            video.Description = description;
            video.IsPublic = isPublic;

            if (subtitleFile != null && subtitleFile.Length > 0)
            {
                var subExt = Path.GetExtension(subtitleFile.FileName).ToLowerInvariant();
                if (subExt != ".vtt") return Results.BadRequest("Subtitles must be in .VTT format.");

                if (!string.IsNullOrEmpty(video.SubtitleFileName))
                {
                    var oldSubPath = Path.Combine("/media/captions", video.SubtitleFileName);
                    if (File.Exists(oldSubPath)) File.Delete(oldSubPath);
                }

                var newSubtitleName = $"{Guid.NewGuid()}{subExt}";
                var newSubPath = Path.Combine("/media/captions", newSubtitleName);
                using var stream = new FileStream(newSubPath, FileMode.Create);
                await subtitleFile.CopyToAsync(stream);

                video.SubtitleFileName = newSubtitleName;
            }

            if (thumbnailFile != null && thumbnailFile.Length > 0)
            {
                var allowedThumbExt = new[] { ".jpg", ".jpeg", ".png", ".webp" };
                var thumbExt = Path.GetExtension(thumbnailFile.FileName).ToLowerInvariant();
                if (!allowedThumbExt.Contains(thumbExt)) return Results.BadRequest("Invalid thumbnail format.");

                if (!string.IsNullOrEmpty(video.ThumbnailFileName))
                {
                    var oldThumbPath = Path.Combine("/media/thumbnails", video.ThumbnailFileName);
                    if (File.Exists(oldThumbPath)) File.Delete(oldThumbPath);
                }

                var newThumbnailName = $"{Guid.NewGuid()}{thumbExt}";
                var newThumbPath = Path.Combine("/media/thumbnails", newThumbnailName);
                using var stream = new FileStream(newThumbPath, FileMode.Create);
                await thumbnailFile.CopyToAsync(stream);

                video.ThumbnailFileName = newThumbnailName;
            }

            await dbContext.SaveChangesAsync();

            return Results.Ok(new { Message = "Video updated successfully." });
        }).DisableAntiforgery();
    }
}