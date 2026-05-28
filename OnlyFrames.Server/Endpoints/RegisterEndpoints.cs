using Microsoft.AspNetCore.Identity;
using OnlyFrames.Server.Models;

namespace OnlyFrames.Server.Endpoints;

/// <summary>
/// Provides extension methods for mapping user registration endpoints.
/// </summary>
public static class RegisterEndpoints
{
    /// <summary>
    /// Maps the user registration endpoint to the application route builder.
    /// Creates a new user in the underlying database using ASP.NET Core Identity.
    /// </summary>
    /// <param name="app">The endpoint route builder.</param>
    public static void MapRegisterEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/auth/register", async (RegisterDto model, UserManager<ApplicationUser> userManager) =>
        {
            var user = new ApplicationUser 
            { 
                UserName = model.Username, 
                Email = model.Email 
            };

            var result = await userManager.CreateAsync(user, model.Password);

            if (!result.Succeeded)
            {
                return Results.BadRequest(result.Errors);
            }

            return Results.Ok(new { Message = "User registered successfully." });
        });
    }
}