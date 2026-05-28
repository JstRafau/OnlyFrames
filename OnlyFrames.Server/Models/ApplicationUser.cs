using Microsoft.AspNetCore.Identity;

namespace OnlyFrames.Server.Models;

// Dziedziczenie po IdentityUser daje nam gotowe pola jak Email, PasswordHash, itp.
public class ApplicationUser : IdentityUser
{
    // Jako platforma streamingowa, w przyszłości dodasz tu np.:
    // public string? ChannelName { get; set; }
    // public string? AvatarUrl { get; set; }
}