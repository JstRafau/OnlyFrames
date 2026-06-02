using Xabe.FFmpeg;

namespace OnlyFrames.Server.Infrastructure;

// Infrastructure/TranscodingService.cs
public class TranscodingService
{
    private readonly string _storagePath;

    public TranscodingService(IConfiguration config)
    {
        _storagePath = config["Storage:VideosPath"]!;
    }

    public async Task TranscodeToHlsAsync(Guid videoId, string inputPath, CancellationToken ct = default)
    {
        var outputDir = Path.Combine(_storagePath, videoId.ToString());
        Directory.CreateDirectory(outputDir);

        var mediaInfo = await FFmpeg.GetMediaInfo(inputPath, ct);
        var videoStream = mediaInfo.VideoStreams.FirstOrDefault()
            ?? throw new InvalidOperationException("No video stream found.");
        var audioStream = mediaInfo.AudioStreams.FirstOrDefault();

        // Generate thumbnail at 5s mark
        await GenerateThumbnailAsync(inputPath, outputDir, ct);

        var sourceHeight = videoStream.Height;
        
        // 360p HLS
        if (sourceHeight >= 360)
            await BuildHlsConversion(inputPath, videoStream, audioStream, outputDir, "360p", 640, 360, ct);
        // 720p HLS
        if (sourceHeight >= 720)
            await BuildHlsConversion(inputPath, videoStream, audioStream, outputDir, "720p", 1280, 720, ct);
        // Hull HD HLS
        if (sourceHeight >= 1080)
            await BuildHlsConversion(inputPath, videoStream, audioStream, outputDir, "1080p", 1920, 1080, ct);
        // 4K HLS
        if (sourceHeight >= 2160)
            await BuildHlsConversion(inputPath, videoStream, audioStream, outputDir, "4K",3840 , 2160, ct);
    }

    private async Task BuildHlsConversion(
        string input, IVideoStream video, IAudioStream? audio,
        string outputDir, string label, int width, int height,
        CancellationToken ct)
    {
        var outputM3U8 = Path.Combine(outputDir, $"{label}.m3u8");
        var segmentPattern = Path.Combine(outputDir, $"{label}_%03d.ts");

        var conversion = FFmpeg.Conversions.New()
            .AddStream(video.SetSize(width, height).SetCodec(VideoCodec.h264))
            .AddParameter($"-hls_time 6 -hls_playlist_type vod -hls_segment_filename \"{segmentPattern}\"")
            .SetOutput(outputM3U8)
            .SetOverwriteOutput(true);

        if (audio != null)
            conversion.AddStream(audio.SetCodec(AudioCodec.aac));

        await conversion.Start(ct);
    }

    private async Task GenerateThumbnailAsync(string input, string outputDir, CancellationToken ct)
    {
        var thumbPath = Path.Combine(outputDir, "thumb.jpg");
        var conversion = await FFmpeg.Conversions.FromSnippet.Snapshot(
            input, thumbPath, TimeSpan.FromSeconds(5));
        await conversion.Start(ct);
    }
}