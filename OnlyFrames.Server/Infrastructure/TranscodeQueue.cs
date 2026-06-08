using System.Threading.Channels;
using OnlyFrames.Server.Models;

namespace OnlyFrames.Server.Infrastructure;

/// <summary>
/// Background service that processes video transcoding jobs sequentially.
/// Jobs are queued via <see cref="Enqueue"/> and consumed one at a time.
///
/// <para>
/// Registered as both <see cref="TranscodeQueue"/> (for enqueueing) and
/// <see cref="Microsoft.Extensions.Hosting.IHostedService"/> (for background execution):
/// <code>
/// builder.Services.AddSingleton&lt;TranscodeQueue&gt;();
/// builder.Services.AddHostedService(sp => sp.GetRequiredService&lt;TranscodeQueue&gt;());
/// </code>
/// </para>
/// </summary>
public class TranscodeQueue : BackgroundService
{
    private readonly Channel<(Guid VideoId, string InputPath, string? SubtitlePath)> _queue =
        Channel.CreateUnbounded<(Guid, string, string?)>();
    private readonly TranscodingService _transcoder;
    private readonly ILogger<TranscodeQueue> _logger;
    private readonly IServiceScopeFactory _scopeFactory;
 
    public TranscodeQueue(
        TranscodingService transcoder,
        ILogger<TranscodeQueue> logger,
        IServiceScopeFactory scopeFactory)
    {
        _transcoder = transcoder;
        _logger = logger;
        _scopeFactory = scopeFactory;
    }
 
    /// <summary>
    /// Adds a video to the transcode queue. Returns immediately, processing is asynchronous.
    /// This method is to be used from video upload code.
    /// </summary>
    /// <param name="videoId">ID of the video record. Used as output directory name.</param>
    /// <param name="inputPath">Absolute path to the raw uploaded video file.</param>
    /// <param name="subtitlePath">Optional absolute path to a subtitle file (.vtt, .srt, .ass). Attached after transcoding.</param>
    /// <example>
    /// <code>
    /// queue.Enqueue(videoId, "/media/videos/raw/upload.mp4");
    /// queue.Enqueue(videoId, "/media/videos/raw/upload.mp4", "/media/videos/{id}/subtitles.vtt");
    /// </code>
    /// </example>
    public void Enqueue(Guid videoId, string inputPath, string? subtitlePath = null) =>
        _queue.Writer.TryWrite((videoId, inputPath, subtitlePath));
 
    /// <summary>
    /// Continuously processes queued transcode jobs until the app shuts down.
    /// Jobs run sequentially. Failed jobs are logged and skipped.
    /// </summary>
    /// <param name="ct">Cancellation token passed through to all FFmpeg operations.</param>
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        await foreach (var (videoId, inputPath, subtitlePath) in _queue.Reader.ReadAllAsync(ct))
        {
            try
            {
                _logger.LogInformation("Transcoding started for {VideoId}", videoId);
 
                await _transcoder.TranscodeToHlsAsync(videoId, inputPath, ct);
 
                if (subtitlePath != null)
                {
                    _logger.LogInformation("Attaching subtitles for {VideoId}", videoId);
                    await _transcoder.AttachExternalSubtitlesAsync(videoId, subtitlePath, ct);
                }
 
                await UpdateStatusInDatabaseAsync(videoId, VideoStatus.Ready);
 
                _logger.LogInformation("Transcoding done for {VideoId}", videoId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Transcode failed for {VideoId}", videoId);
                await UpdateStatusInDatabaseAsync(videoId, VideoStatus.Failed);
            }
        }
    }
 
    /// <summary>
    /// Helper method creating short DbContext lifespan, used to update upload status.
    /// </summary>
    private async Task UpdateStatusInDatabaseAsync(Guid videoId, VideoStatus newStatus)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
 
        var video = await dbContext.Videos.FindAsync(videoId);
        if (video != null)
        {
            video.Status = newStatus;
            await dbContext.SaveChangesAsync();
        }
    }
}
