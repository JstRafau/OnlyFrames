namespace OnlyFrames.Server.Endpoints;

/// <summary>
/// Provides extension methods for mapping video streaming endpoints.
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
        var group = app.MapGroup("/api");
        group.MapGet("/videos/{videoId}/stream", (Guid videoId, IConfiguration config) =>
        {
            var m3U8 = Path.Combine(config["Storage:VideosPath"]!, videoId.ToString(), "720p.m3u8");
            if (!File.Exists(m3U8)) return Results.NotFound();
            return Results.File(m3U8, "application/vnd.apple.mpegurl");
        });
        
        group.MapGet("/videos/{videoId}/stream/{ts}", (Guid videoId, string ts, IConfiguration config) =>
        {
            var tsFile = Path.Combine(config["Storage:VideosPath"]!, videoId.ToString(), ts);
            if (!File.Exists(tsFile)) return Results.NotFound();
            return Results.File(tsFile, "application/vnd.apple.mpegurl");
        });
    }
}