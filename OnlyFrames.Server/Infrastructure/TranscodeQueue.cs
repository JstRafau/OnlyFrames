using System.Threading.Channels;
using OnlyFrames.Server.Models;

namespace OnlyFrames.Server.Infrastructure;

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

    public void Enqueue(Guid videoId, string inputPath) =>
        _queue.Writer.TryWrite((videoId, inputPath));

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