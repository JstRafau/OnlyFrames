using System.Threading.Channels;

namespace OnlyFrames.Server.Infrastructure;

public class TranscodeQueue : BackgroundService
{
    private readonly Channel<(Guid VideoId, string InputPath)> _queue =
        Channel.CreateUnbounded<(Guid, string)>();
    private readonly TranscodingService _transcoder;
    private readonly ILogger<TranscodeQueue> _logger;

    public TranscodeQueue(TranscodingService transcoder, ILogger<TranscodeQueue> logger)
    {
        _transcoder = transcoder;
        _logger = logger;
    }

    public void Enqueue(Guid videoId, string inputPath) =>
        _queue.Writer.TryWrite((videoId, inputPath));

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        await foreach (var (videoId, inputPath) in _queue.Reader.ReadAllAsync(ct))
        {
            try
            {
                _logger.LogInformation("Transcoding {VideoId}", videoId);
                await _transcoder.TranscodeToHlsAsync(videoId, inputPath, ct);
                _logger.LogInformation("Done {VideoId}", videoId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Transcode failed {VideoId}", videoId);
            }
        }
    }
}