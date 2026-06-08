using System.Text;
using CliWrap;
using CliWrap.Buffered;
using Xabe.FFmpeg;

namespace OnlyFrames.Server.Infrastructure;

/// <summary>
/// Handles video transcoding to HLS format and subtitle processing.
///
/// <para>
/// Transcoding pipeline:
/// <list type="number">
///   <item>Raw video uploaded → <see cref="TranscodeToHlsAsync"/> queued via <see cref="TranscodeQueue"/></item>
///   <item>FFmpeg generates HLS streams for each applicable resolution</item>
///   <item>Embedded subtitles (if any) extracted to <c>captions.vtt</c></item>
///   <item><c>master.m3u8</c> generated — references all quality levels and subtitles</item>
/// </list>
/// </para>
///
/// <para>
/// Output structure per video:
/// <code>
/// /media/videos/{videoId}/
///   master.m3u8        ← served by stream endpoint
///   360p.m3u8
///   360p_0001.ts
///   720p.m3u8
///   720p_0001.ts
///   1080p.m3u8         ← only if source >= 1080p
///   4k.m3u8            ← only if source >= 2160p
///   captions.vtt       ← embedded or externally attached subtitles
///   captions.m3u8      ← HLS subtitle playlist wrapping captions.vtt
///   thumb.jpg
/// </code>
/// </para>
///
/// <para>Subtitle scenarios:</para>
/// <list type="bullet">
///   <item>No subtitles — <c>master.m3u8</c> generated without subtitle track</item>
///   <item>Embedded subtitles — extracted automatically during transcode</item>
///   <item>External subtitles — call <see cref="AttachExternalSubtitlesAsync"/> after upload; supports .srt, .ass, .vtt</item>
/// </list>
/// </summary>
public class TranscodingService
{
    private readonly string _storagePath;

    public TranscodingService(IConfiguration config)
    {
        _storagePath = config["Storage:VideosPath"]!;
    }

    /// <summary>
    /// Transcodes a raw video file to multi-resolution HLS.
    /// Generates resolutions based on source height — never upscales.
    /// Extracts embedded subtitles if present.
    /// </summary>
    /// <param name="videoId">Used as output directory name under storage path.</param>
    /// <param name="inputPath">Absolute path to raw uploaded video file.</param>
    /// <param name="ct">Cancellation token passed through to all FFmpeg operations.</param>
    /// <example>
    /// Typical usage via <see cref="TranscodeQueue"/>:
    /// <code>
    /// queue.Enqueue(videoId, "/media/videos/raw/upload.mp4");
    /// </code>
    /// Direct usage:
    /// <code>
    /// await transcodingService.TranscodeToHlsAsync(
    ///     Guid.Parse("0ce5c445-..."),
    ///     "/media/videos/raw/upload.mp4",
    ///     cancellationToken);
    /// </code>
    /// </example>
    public async Task TranscodeToHlsAsync(Guid videoId, string inputPath, CancellationToken ct = default)
    {
        var outputDir = Path.Combine(_storagePath, videoId.ToString());
        Directory.CreateDirectory(outputDir);

        var mediaInfo = await FFmpeg.GetMediaInfo(inputPath, ct);
        var videoStream = mediaInfo.VideoStreams.FirstOrDefault()
            ?? throw new InvalidOperationException("No video stream found.");
        var audioStream = mediaInfo.AudioStreams.FirstOrDefault();
        var subtitleStream = mediaInfo.SubtitleStreams.FirstOrDefault();

        await GenerateThumbnailAsync(inputPath, outputDir, ct);

        var sourceHeight = videoStream.Height;
        var generatedStreams = new List<(string label, int bandwidth, int width, int height)>();

        if (sourceHeight >= 360)
        {
            await BuildHlsConversion(videoStream, audioStream, outputDir, "360p", 640, 360, ct);
            generatedStreams.Add(("360p", 800_000, 640, 360));
        }
        if (sourceHeight >= 720)
        {
            await BuildHlsConversion(videoStream, audioStream, outputDir, "720p", 1280, 720, ct);
            generatedStreams.Add(("720p", 3_000_000, 1280, 720));
        }
        if (sourceHeight >= 1080)
        {
            await BuildHlsConversion(videoStream, audioStream, outputDir, "1080p", 1920, 1080, ct);
            generatedStreams.Add(("1080p", 6_000_000, 1920, 1080));
        }
        if (sourceHeight >= 2160)
        {
            await BuildHlsConversion(videoStream, audioStream, outputDir, "4k", 3840, 2160, ct);
            generatedStreams.Add(("4k", 20_000_000, 3840, 2160));
        }
        
        //var firstSegment = Directory.GetFiles(outputDir, "*_0000.ts").FirstOrDefault();
        //long mpegTsOffset = 0;
        //if (firstSegment is not null)
        //{
        //    mpegTsOffset = await GetMpegTsOffsetAsync(firstSegment, ct);
        //}

        if (subtitleStream != null)
        {
            var vttPath = Path.Combine(outputDir, "captions.vtt");
            await FFmpeg.Conversions.New()
                .AddStream(subtitleStream)
                .SetOutput(vttPath)
                .SetOverwriteOutput(true)
                .Start(ct);

            await GenerateSubtitleM3U8Async(outputDir, "captions.vtt", "captions.m3u8"/*, mpegTsOffset*/, ct);
        }

        var hasSubtitles = File.Exists(Path.Combine(outputDir, "captions.m3u8"));
        GenerateMasterPlaylist(outputDir, generatedStreams, hasSubtitles);
    }

    /// <summary>
    /// Attaches an external subtitle file to an already-transcoded video.
    /// Converts .srt/.ass to WebVTT automatically.
    /// Regenerates <c>master.m3u8</c> to include the subtitle track.
    /// Can be called at any time after initial transcoding.
    /// </summary>
    /// <param name="videoId">Must match an already-transcoded video.</param>
    /// <param name="inputSubPath">Absolute path to subtitle file (.vtt, .srt, or .ass).</param>
    /// <param name="ct">Cancellation token passed through to all FFmpeg operations.</param>
    /// <example>
    /// <code>
    /// await transcodingService.AttachExternalSubtitlesAsync(
    ///     videoId,
    ///     "/tmp/uploaded-subtitles.srt",
    ///     cancellationToken);
    /// </code>
    /// </example>
    public async Task AttachExternalSubtitlesAsync(Guid videoId, string inputSubPath, CancellationToken ct = default)
    {
        var outputDir = Path.Combine(_storagePath, videoId.ToString());
        var vttPath = Path.Combine(outputDir, "captions.vtt");
        var ext = Path.GetExtension(inputSubPath).ToLower();

        if (ext == ".vtt")
            File.Copy(inputSubPath, vttPath, overwrite: true);
        else
            await FFmpeg.Conversions.New()
                .AddParameter($"-i \"{inputSubPath}\"")
                .SetOutput(vttPath)
                .SetOverwriteOutput(true)
                .Start(ct);
        
        //var firstSegment = Directory.GetFiles(outputDir, "*_0000.ts").FirstOrDefault();
        //long mpegTsOffset = 0;
        //if (firstSegment is not null)
        //{
        //    mpegTsOffset = await GetMpegTsOffsetAsync(firstSegment, ct);
        //}

        await GenerateSubtitleM3U8Async(outputDir, "captions.vtt", "captions.m3u8"/*, mpegTsOffset*/, ct);

        // rebuild master with subtitles — parse existing quality streams from master.m3u8
        var masterPath = Path.Combine(outputDir, "master.m3u8");
        if (!File.Exists(masterPath)) return;

        var existing = await File.ReadAllLinesAsync(masterPath, ct);
        var streams = existing
            .Where(l => l.EndsWith(".m3u8") && !l.Contains("captions") && !l.Contains("master"))
            .Select(l => Path.GetFileNameWithoutExtension(l) switch
            {
                "360p"  => ("360p",  800_000,    640,  360),
                "720p"  => ("720p",  3_000_000,  1280, 720),
                "1080p" => ("1080p", 6_000_000,  1920, 1080),
                "4k"    => ("4k",    20_000_000, 3840, 2160),
                var n   => (n,       3_000_000,  1280, 720)
            })
            .ToList();

        GenerateMasterPlaylist(outputDir, streams, hasSubtitles: true);
    }

    /// <summary>
    /// Wraps a single WebVTT file in an HLS subtitle playlist.
    /// Required because HLS players expect subtitle tracks as .m3u8 references.
    /// </summary>
    /// <param name="outputDir">Video output directory.</param>
    /// <param name="vttFile">VTT filename (not full path), e.g. <c>captions.vtt</c>.</param>
    /// <param name="m3U8File">Output playlist filename, e.g. <c>captions.m3u8</c>.</param>
    /// <param name="mpegTsOffset">Video offset used to sync captions with video.</param>
    /// <param name="ct">Cancellation token passed through to all FFmpeg operations.</param>
    private static async Task GenerateSubtitleM3U8Async(
        string outputDir, string vttFile, string m3U8File/*, long mpegTsOffset*/, CancellationToken ct)
    {
        var content = "#EXTM3U\n" +
                      "#EXT-X-TARGETDURATION:99999\n" +
                      "#EXT-X-VERSION:3\n" +
                      "#EXT-X-MEDIA-SEQUENCE:0\n" + 
                   /* $"X-TIMESTAMP-MAP:MPEGTS={mpegTsOffset},LOCAL=00:00:00.000\n" + */
                      "#EXTINF:99999,\n" +
                      $"{vttFile}\n" +
                      "#EXT-X-ENDLIST\n";
        await File.WriteAllTextAsync(Path.Combine(outputDir, m3U8File), content, ct);
    }

    /// <summary>
    /// Generates <c>master.m3u8</c> — the HLS entry point served to the player.
    /// References all quality variants and optionally a subtitle track.
    /// </summary>
    /// <param name="outputDir">Video output directory.</param>
    /// <param name="streams">Quality variants to include, in ascending order.</param>
    /// <param name="hasSubtitles">When true, references <c>captions.m3u8</c> as subtitle track.</param>
    private static void GenerateMasterPlaylist(
        string outputDir,
        List<(string label, int bandwidth, int width, int height)> streams,
        bool hasSubtitles)
    {
        var sb = new StringBuilder();
        sb.AppendLine("#EXTM3U");

        if (hasSubtitles)
            sb.AppendLine("#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=\"subs\",NAME=\"Subtitles\",DEFAULT=YES,AUTOSELECT=YES,URI=\"captions.m3u8\"");

        foreach (var (label, bandwidth, width, height) in streams)
        {
            var subs = hasSubtitles ? ",SUBTITLES=\"subs\"" : "";
            sb.AppendLine($"#EXT-X-STREAM-INF:BANDWIDTH={bandwidth},RESOLUTION={width}x{height}{subs}");
            sb.AppendLine($"{label}.m3u8");
        }

        File.WriteAllText(Path.Combine(outputDir, "master.m3u8"), sb.ToString());
    }

    /// <summary>
    /// Converts a single video stream to HLS at the given resolution.
    /// Forces yuv420p (8-bit) and H.264 High profile for browser compatibility.
    /// 6-second segments, VOD playlist type.
    /// </summary>
    /// <param name="video">Source video stream from FFmpeg media info.</param>
    /// <param name="audio">Source audio stream, or null if none.</param>
    /// <param name="outputDir">Video output directory.</param>
    /// <param name="label">Quality label used in filenames, e.g. <c>720p</c>, <c>4k</c>.</param>
    /// <param name="width">Target width in pixels.</param>
    /// <param name="height">Target height in pixels.</param>
    /// <param name="ct">Cancellation token passed through to all FFmpeg operations.</param>
    private static async Task BuildHlsConversion(
        IVideoStream video, IAudioStream? audio,
        string outputDir, string label, int width, int height,
        CancellationToken ct)
    {
        var outputM3U8 = Path.Combine(outputDir, $"{label}.m3u8");
        var segmentPattern = Path.Combine(outputDir, $"{label}_%04d.ts");

        var conversion = FFmpeg.Conversions.New()
            .AddStream(video.SetSize(width, height).SetCodec(VideoCodec.h264))
            .AddParameter("-vf format=yuv420p")
            .AddParameter("-profile:v high")
            .AddParameter("-level:v 4.0")
            .AddParameter("-hls_time 6")
            .AddParameter("-hls_playlist_type vod")
            .AddParameter("-muxpreload 0")
            .AddParameter("-muxdelay 0")
            .AddParameter($"-hls_segment_filename \"{segmentPattern}\"")
            .SetOutput(outputM3U8)
            .SetOverwriteOutput(true);

        if (audio != null)
            conversion.AddStream(audio.SetCodec(AudioCodec.aac));

        await conversion.Start(ct);
    }

    /// <summary>
    /// Captures a thumbnail at the 5-second mark of the video.
    /// Output: <c>thumb.jpg</c> in the video output directory.
    /// </summary>
    /// <param name="input">Absolute path to raw uploaded video file.</param>
    /// <param name="outputDir">Video output directory.</param>
    /// <param name="ct">Cancellation token passed through to all FFmpeg operations.</param>
    private static async Task GenerateThumbnailAsync(string input, string outputDir, CancellationToken ct)
    {
        var thumbPath = Path.Combine(outputDir, "thumb.jpg");
        var conversion = await FFmpeg.Conversions.FromSnippet.Snapshot(
            input, thumbPath, TimeSpan.FromSeconds(5));
        await conversion.Start(ct);
    }
    
    /// <summary>
    /// Reads the PTS start time from a .ts segment and converts to MPEG-TS clock units (90kHz).
    /// Used to generate accurate X-TIMESTAMP-MAP for subtitle sync in HLS.
    /// </summary>
    /// <param name="segmentPath">Absolute path to a .ts segment file, typically the first one.</param>
    /// <param name="ct">Cancellation token passed through to all FFmpeg operations.</param>
    /// <returns>PTS offset in 90kHz MPEG-TS units, e.g. 133507 for ~1.48s offset.</returns>
    private static async Task<long> GetMpegTsOffsetAsync(string segmentPath, CancellationToken ct)
    {
        var result = await Cli.Wrap("ffprobe")
            .WithArguments($"-v quiet -show_entries stream=start_time -of csv \"{segmentPath}\"")
            .ExecuteBufferedAsync(ct);

        var firstTime = result.StandardOutput
            .Split('\n', StringSplitOptions.RemoveEmptyEntries)
            .Select(l => l.Split(',').LastOrDefault())
            .Where(v => double.TryParse(v, System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out _))
            .Select(v => double.Parse(v!, System.Globalization.CultureInfo.InvariantCulture))
            .FirstOrDefault();

        return (long)(firstTime * 90000);
    }
}