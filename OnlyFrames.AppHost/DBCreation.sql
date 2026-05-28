DROP TABLE IF EXISTS "Users";
DROP TABLE IF EXISTS "Videos";

CREATE TABLE "Users" (
    "UserId" UUID PRIMARY KEY,
    "Username" VARCHAR(100) NOT NULL,
    "Email" VARCHAR(150) NOT NULL,
    "Password" TEXT NOT NULL
);

CREATE TABLE "Videos" (
    "Id" UUID PRIMARY KEY,
    "Title" VARCHAR(200) NOT NULL,
    "Description" VARCHAR(2000),
    "VideoFileName" VARCHAR(255) NOT NULL,
    "SubtitleFileName" VARCHAR(255),
    "ThumbnailFileName" VARCHAR(255),
    "IsPublic" BOOLEAN NOT NULL DEFAULT FALSE,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "UserId" UUID NOT NULL,
    
    CONSTRAINT fk_user FOREIGN KEY ("UserId") REFERENCES "Users"("UserId") ON DELETE CASCADE
);