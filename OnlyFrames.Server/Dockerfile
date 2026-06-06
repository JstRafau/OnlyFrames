FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER root
# Instalujemy ffmpeg ORAZ tworzymy foldery z odpowiednimi uprawnieniami w jednym kroku
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /media/videos /media/avatars /media/captions \
    && chown -R $APP_UID:$APP_UID /media
# Wracamy do bezpiecznego użytkownika
USER $APP_UID
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["OnlyFrames.Server.csproj", "."]
RUN dotnet restore "OnlyFrames.Server.csproj"
COPY . .
RUN dotnet publish "OnlyFrames.Server.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "OnlyFrames.Server.dll"]