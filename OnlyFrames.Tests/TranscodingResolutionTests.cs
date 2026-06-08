namespace OnlyFrames.Tests;

public class TranscodingResolutionTests
{
    private static List<string> GetApplicableResolutions(int sourceHeight)
    {
        var labels = new List<string>();
        if (sourceHeight >= 360)  labels.Add("360p");
        if (sourceHeight >= 720)  labels.Add("720p");
        if (sourceHeight >= 1080) labels.Add("1080p");
        if (sourceHeight >= 2160) labels.Add("4k");
        return labels;
    }
 
    [Theory]
    [InlineData(480,  new[] { "360p" })]
    [InlineData(720,  new[] { "360p", "720p" })]
    [InlineData(1080, new[] { "360p", "720p", "1080p" })]
    [InlineData(2160, new[] { "360p", "720p", "1080p", "4k" })]
    public void Resolutions_NeverUpscales(int sourceHeight, string[] expected)
    {
        var result = GetApplicableResolutions(sourceHeight);
        Assert.Equal(expected, result);
    }
 
    [Fact]
    public void Resolutions_Below360p_ReturnsEmpty()
    {
        var result = GetApplicableResolutions(240);
        Assert.Empty(result);
    }

}