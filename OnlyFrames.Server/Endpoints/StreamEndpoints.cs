using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using OnlyFrames.Server.Models;

namespace OnlyFrames.Server.Endpoints;

/// <summary>
/// Provides extension methods for mapping video streaming endpoints with security checks.
/// </summary>
public static class StreamEndpoints
{
    /// <summary>
    /// Maps the video streaming endpoint to the application route builder.
    /// Creates a new user in the underlying database using ASP.NET Core Identity.
    /// Serves a <a href="https://en.wikipedia.org/wiki/M3U">MP3 URL</a>
    /// containing a list of needed encoded video streams,
    /// under <code>/api/videos/{video-guid}/stream</code>
    /// as well as proper .ts encoded video streams 
    /// under <code>/api/videos/{video-guid}/stream/{file.ts}</code>
    /// </summary>
    /// <param name="app">The endpoint route builder.</param>
    public static void MapStreamEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/videos/stream");

        group.MapGet("/{videoId:guid}", async (
            Guid videoId,
            IConfiguration config,
            AppDbContext dbContext,
            ClaimsPrincipal userPrincipal) =>
        {

            var video = await dbContext.Videos.FindAsync(videoId);
            if (video == null) return Results.NotFound("Video not found.");

            if (!video.IsPublic)
            {
                var currentUserId = userPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (currentUserId == null || video.UserId != currentUserId)
                {
                    return Results.Json(new { Message = "This video is private." }, statusCode: 403);
                }
            }

            var defaultStoragePath = Path.Combine(Directory.GetCurrentDirectory(), "media", "videos");
            var storagePath = config["Storage:VideosPath"] ?? defaultStoragePath;

            var m3U8 = Path.Combine(config["Storage:VideosPath"]!, videoId.ToString(), "master.m3u8");

            if (!File.Exists(m3U8)) return Results.NotFound();

            return Results.File(m3U8, "application/vnd.apple.mpegurl");
        });

        group.MapGet("/{videoId:guid}/{file}", async (
            Guid videoId,
            string file,
            IConfiguration config,
            AppDbContext dbContext,
            ClaimsPrincipal userPrincipal) =>
        {
            var video = await dbContext.Videos.FindAsync(videoId);
            if (video == null) return Results.NotFound("Video not found.");

            if (!video.IsPublic)
            {
                var currentUserId = userPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (currentUserId == null || video.UserId != currentUserId)
                {
                    return Results.Json(new { Message = "This video is private." }, statusCode: 403);
                }
            }

            var ext = Path.GetExtension(file);
            if (ext != ".ts" && ext != ".m3u8" && ext != ".vtt" && ext != ".jpg")
                return Results.BadRequest();

            var defaultStoragePath = Path.Combine(Directory.GetCurrentDirectory(), "media", "videos");
            var storagePath = config["Storage:VideosPath"] ?? defaultStoragePath;

            var path = Path.Combine(storagePath, videoId.ToString(), file);

            var fullPath = Path.GetFullPath(path);
            var basePath = Path.GetFullPath(Path.Combine(storagePath, videoId.ToString()));
            if (!fullPath.StartsWith(basePath))
                return Results.BadRequest();

            if (!File.Exists(fullPath)) return Results.NotFound();

            string contentType = ext switch
            {
                ".ts"  => "video/mp2t",
                ".vtt" => "text/vtt",
                ".jpg" => "image/jpg",
                _      => "application/vnd.apple.mpegurl"
            };

            return Results.File(fullPath, contentType);
        });
    }
}