using Microsoft.AspNetCore.Identity;
using OnlyFrames.Server.Models;

namespace OnlyFrames.Server.Endpoints;

/// <summary>
/// Provides extension methods for mapping user authentication and login endpoints.
/// </summary>
public static class LoginEndpoints
{
    /// <summary>
    /// Maps the user login endpoint to the application route builder.
    /// Supports authentication using either a registered email address or a username.
    /// </summary>
    /// <param name="app">The endpoint route builder.</param>
    public static void MapLoginEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/auth/login", async (LoginDto model, UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager) =>
        {
            var user = model.LoginOrEmail.Contains('@')
                ? await userManager.FindByEmailAsync(model.LoginOrEmail)
                : await userManager.FindByNameAsync(model.LoginOrEmail);

            if (user == null || !await userManager.CheckPasswordAsync(user, model.Password))
            {
                return Results.BadRequest(new { Message = "Invalid username/email or password." });
            }

            await signInManager.SignInAsync(user, isPersistent: true);

            return Results.Ok(new { Message = "Logged in successfully." });
        });
    }
}