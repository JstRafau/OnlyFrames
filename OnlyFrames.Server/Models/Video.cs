using System.ComponentModel.DataAnnotations;

namespace OnlyFrames.Server.Models;

public enum VideoStatus
{
    Processing,
    Ready,
    Failed
}

public class Video
{
    public Guid Id { get; init; }
    [MaxLength(100)]
    public string Title { get; init; } = string.Empty;
    [MaxLength(1000)]
    public string? Description { get; set; }
    public bool IsPublic { get; init; } = false;
    public VideoStatus Status { get; set; } = VideoStatus.Processing;
    public DateTimeOffset CreatedAt { get; init; }
  
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
}