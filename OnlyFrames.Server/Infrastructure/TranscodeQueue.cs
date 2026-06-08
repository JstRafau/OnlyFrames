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
    private readonly Channel<(Guid VideoId, string InputPath)> _queue =
        Channel.CreateUnbounded<(Guid, string)>();
    private readonly TranscodingService _transcoder;
    private readonly ILogger<TranscodeQueue> _logger;
    private readonly IServiceScopeFactory _scopeFactory; // Fabryka do tworzenia dostępu do bazy

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
    /// <example>
    /// <code>
    /// queue.Enqueue(videoId, "/media/videos/raw/upload.mp4");
    /// </code>
    /// </example>
    public void Enqueue(Guid videoId, string inputPath) =>
        _queue.Writer.TryWrite((videoId, inputPath));

    /// <summary>
    /// Continuously processes queued transcode jobs until the app shuts down.
    /// Jobs run sequentially. Failed jobs are logged and skipped.
    /// </summary>
    /// <param name="ct">Cancellation token passed through to all FFmpeg operations.</param>
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        await foreach (var (videoId, inputPath) in _queue.Reader.ReadAllAsync(ct))
        {
            try
            {
                _logger.LogInformation("Transcoding started for {VideoId}", videoId);
                
                // 1. FFmpeg robi swoją magię (HLS + Miniaturka)
                await _transcoder.TranscodeToHlsAsync(videoId, inputPath, ct);
                
                // 2. Sukces! Zmieniamy status w bazie na Ready
                await UpdateStatusInDatabaseAsync(videoId, VideoStatus.Ready);
                
                _logger.LogInformation("Transcoding done for {VideoId}", videoId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Transcode failed for {VideoId}", videoId);
                
                // 3. Coś poszło nie tak (np. zły format pliku) -> status Failed
                await UpdateStatusInDatabaseAsync(videoId, VideoStatus.Failed);
            }
        }
    }

    /// <summary>
    /// Pomocnicza metoda tworząca krótki cykl życia DbContextu, aby zaktualizować status filmu.
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