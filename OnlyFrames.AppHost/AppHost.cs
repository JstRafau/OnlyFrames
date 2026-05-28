using Microsoft.Extensions.DependencyInjection;

var builder = DistributedApplication.CreateBuilder(args);
 
builder.AddDockerComposeEnvironment("env");
 
var db = builder.AddPostgres("postgres")
    .WithDataVolume("postgres-data")
    .AddDatabase("appdb");
 
var videosPath = builder.Configuration["Volumes:Videos"] ?? "/opt/onlyframes/videos";
var captionsPath = builder.Configuration["Volumes:Captions"] ?? "/opt/onlyframes/captions";
var avatarsPath = builder.Configuration["Volumes:Avatars"] ?? "/opt/onlyframes/avatars";

var api = builder.AddDockerfile("api", "../OnlyFrames.Server")
    .WithReference(db)
    .WaitFor(db)
    .WithEndpoint(port: 8080, targetPort: 8080, name: "http", scheme: "http", isExternal: false)
    .WithHttpHealthCheck("/health")
    .WithBindMount(videosPath, "/media/videos")
    .WithBindMount(captionsPath, "/media/captions") 
    .WithBindMount(avatarsPath, "/media/avatars"); 

var frontend = builder.AddViteApp("frontend", "../frontend")
    .WithReference(api.GetEndpoint("http"))
    .WithEnvironment("VITE_API_BASE_URL", "http://localhost:8080")
    .WithEndpoint(port: 3000, targetPort: 3000, name: "http", isExternal: false)
    .PublishAsDockerFile();
 
builder.AddContainer("caddy", "caddy", "2-alpine")
    .WithBindMount("../caddy", "/etc/caddy")
    .WithVolume("caddy-data", "/data")
    .WithVolume("caddy-config", "/config")
    .WithEndpoint(port: 80, targetPort: 80, name: "http", scheme: "http", isExternal: true)
    .WithEndpoint(port: 443, targetPort: 443, name: "https", scheme: "https", isExternal: true)
    .WithReference(api.GetEndpoint("http"))
    .WithReference(frontend)
    .WaitFor(api)
    .WaitFor(frontend);

builder.Services.AddHealthChecks();
 
builder.Build().Run();
