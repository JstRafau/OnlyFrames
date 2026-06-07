namespace OnlyFrames.Server.Models;

public record RegisterDto(string Email, string Username, string Password);
public record LoginDto(string LoginOrEmail, string Password);
public record ChangePasswordDto(string CurrentPassword, string NewPassword);
public record ChangeUsernameDto(string NewUsername);