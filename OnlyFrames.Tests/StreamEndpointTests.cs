namespace OnlyFrames.Tests;
 
public class StreamEndpointTests
{
    private static string GetContentType(string ext) => ext switch
    {
        ".ts"   => "video/mp2t",
        ".vtt"  => "text/vtt",
        _       => "application/vnd.apple.mpegurl"
    };
 
    private static bool IsPathSafe(string basePath, string requestedFile)
    {
        var fullPath = Path.GetFullPath(Path.Combine(basePath, requestedFile));
        return fullPath.StartsWith(Path.GetFullPath(basePath));
    }
 
    [Theory]
    [InlineData(".ts",   "video/mp2t")]
    [InlineData(".m3u8", "application/vnd.apple.mpegurl")]
    [InlineData(".vtt",  "text/vtt")]
    public void ContentType_ReturnsCorrectType(string ext, string expected)
    {
        Assert.Equal(expected, GetContentType(ext));
    }
 
    [Theory]
    [InlineData("720p_0001.ts",       true)]
    [InlineData("captions.vtt",       true)]
    [InlineData("master.m3u8",        true)]
    [InlineData("../other/file.ts",   false)]
    [InlineData("../../etc/passwd",   false)]
    public void PathTraversal_DetectedCorrectly(string file, bool expectedSafe)
    {
        var basePath = "/media/videos/some-guid";
        Assert.Equal(expectedSafe, IsPathSafe(basePath, file));
    }
}