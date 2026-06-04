using Xabe.FFmpeg;
using Xabe.FFmpeg.Downloader;

namespace OnlyFrames.Server.Infrastructure;

/// <summary>
/// Manages FFmpeg Setup.
/// </summary>
public static class FFmpegSetup
{
    /// <summary>
    /// Method responsible for initializing FFmpeg.
    /// </summary>
    /// <returns>
    /// async Task of 
    /// </returns>
    public static async Task InitializeAsync()
    {
        FFmpeg.SetExecutablesPath(
            Environment.GetEnvironmentVariable("FFMPEG_PATH") ?? "/usr/bin"
        );
    }
}