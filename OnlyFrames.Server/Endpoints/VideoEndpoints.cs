namespace OnlyFrames.Server.Endpoints;

/// <summary>
/// Provides extension methods for mapping video management endpoints.
/// </summary>
public static class VideoEndpoints
{
    /// <summary>
    /// get, upload and delete vidyo data
    /// </summary>
    /// <param name="app">The endpoint route builder.</param>
    public static void MapVideoEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/videos");
        group.MapGet("/all", ( IConfiguration config) =>
        {
            return Results.Ok(new[]
            {
                new
                {
                    Id = Guid.Parse("0ce5c445-5f0b-4e06-8ed7-6a1f32674d3f"),
                    Title = "Frieren: Beyond Journey's End S1:E01",
                    Description = "",
                    IsPublic = true,
                    status = "ready",
                    CreatedAt = DateTime.Now
                }
            });
        });
        
        group.MapPost("/upload", ( IConfiguration config) =>
        {
            return Results.StatusCode(StatusCodes.Status501NotImplemented);
            // return Results.Created(); // https://http.cat/status/201
        });
        
        group.MapDelete("/remove", (Guid videoId, IConfiguration config) =>
        {
            //if (move with GUID not exist) return Results.NotFound();
            return Results.StatusCode(StatusCodes.Status501NotImplemented);
            // return Results.NoContent(); // https://http.cat/status/204
        });
        
    }
}

