using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlyFrames.Server.Models;
using OnlyFrames.Server.Infrastructure;

namespace OnlyFrames.Server.Endpoints;

/// <summary>
/// Provides extension methods to map public and authenticated video management endpoints.
/// </summary>
public static class VideoEndpoints
{
    /// <summary>
    /// Maps all video routing groups to the web application instance.
    /// </summary>
    /// <param name="app">The endpoint route builder used to map the routes.</param>
    public static void MapVideoEndpoints(this IEndpointRouteBuilder app)
    {
        var publicGroup = app.MapGroup("/api/videos");
        
        publicGroup.MapGet("/all", async (AppDbContext dbContext) =>
        {
            var videos = await dbContext.Videos
                .Select(v => new
                {
                    v.Id,
                    v.Title,
                    v.Description,
                    v.IsPublic,
                    Status = v.Status.ToString().ToLowerInvariant(),
                    v.CreatedAt
                })
                .ToListAsync();

            return Results.Ok(videos);
        });

        var authGroup = app.MapGroup("/api/videos").RequireAuthorization();

        authGroup.MapPost("/upload", async (
            [FromForm] string title,
            [FromForm] string? description,
            [FromForm] bool isPublic,
            IFormFile videoFile,
            IFormFile? subtitleFile,
            ClaimsPrincipal userPrincipal,
            UserManager<ApplicationUser> userManager,
            AppDbContext dbContext,
            TranscodeQueue transcodeQueue,
            IConfiguration config) =>
        {
            var user = await userManager.GetUserAsync(userPrincipal);
            if (user == null) return Results.Unauthorized();

            if (videoFile.Length == 0)
                return Results.BadRequest("Video file is required.");

            var allowedVideoExt = new[] { ".mp4", ".webm", ".mkv", ".mov" };
            var videoExt = Path.GetExtension(videoFile.FileName).ToLowerInvariant();
            if (!allowedVideoExt.Contains(videoExt))
                return Results.BadRequest("Invalid video format.");

            var videoId = Guid.NewGuid();
            var storagePath = config["Storage:VideosPath"] ?? "/media/videos";
            var videoDir = Path.Combine(storagePath, videoId.ToString());

            Directory.CreateDirectory(videoDir);

            var rawVideoPath = Path.Combine(videoDir, $"raw{videoExt}");
            using (var stream = new FileStream(rawVideoPath, FileMode.Create))
            {
                await videoFile.CopyToAsync(stream);
            }

            if (subtitleFile != null && subtitleFile.Length > 0)
            {
                var subExt = Path.GetExtension(subtitleFile.FileName).ToLowerInvariant();
                if (subExt != ".vtt") return Results.BadRequest("Subtitles must be in .VTT format.");

                var subPath = Path.Combine(videoDir, $"subtitles{subExt}");
                using var stream = new FileStream(subPath, FileMode.Create);
                await subtitleFile.CopyToAsync(stream);
            }

            var newVideo = new Video
            {
                Id = videoId,
                Title = title,
                Description = description,
                IsPublic = isPublic,
                Status = VideoStatus.Processing,
                CreatedAt = DateTime.UtcNow,
                UserId = user.Id
            };

            dbContext.Videos.Add(newVideo);
            await dbContext.SaveChangesAsync();

            transcodeQueue.Enqueue(videoId, rawVideoPath);

            return Results.Ok(new { Message = "Video upload started.", VideoId = videoId });
        }).DisableAntiforgery();

        authGroup.MapDelete("/remove/{id:guid}", async (
            Guid id,
            ClaimsPrincipal userPrincipal,
            UserManager<ApplicationUser> userManager,
            AppDbContext dbContext,
            IConfiguration config) =>
        {
            var user = await userManager.GetUserAsync(userPrincipal);
            if (user == null) return Results.Unauthorized();

            var video = await dbContext.Videos.FindAsync(id);
            if (video == null) return Results.NotFound("Video not found.");

            if (video.UserId != user.Id) return Results.Forbid();

            dbContext.Videos.Remove(video);
            await dbContext.SaveChangesAsync();

            var storagePath = config["Storage:VideosPath"] ?? "/media/videos";
            var videoDir = Path.Combine(storagePath, id.ToString());

            if (Directory.Exists(videoDir))
            {
                Directory.Delete(videoDir, recursive: true);
            }

            return Results.NoContent();
        });
    }
}