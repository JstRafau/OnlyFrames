using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace OnlyFrames.Server.Models;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public DbSet<Video> Videos { get; set; }

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }
}