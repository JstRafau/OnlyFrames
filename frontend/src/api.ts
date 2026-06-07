const BASE = "/api";

// ==========================================
// 1. FUNKCJE WIDEO (Twoje, nienaruszone)
// ==========================================

export interface Video {
    id: string;
    title: string;
    description?: string;
    isPublic: boolean;
    status: "processing" | "ready" | "failed";
    createdAt: string;
    userId: string;
}

export async function getVideos(): Promise<Video[]> {
    const res = await fetch(`${BASE}/videos/all`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function uploadVideo(
    title: string,
    description: string,
    isPublic: boolean,
    videoFile: File,
    subtitleFile: File | null,
    onProgress: (pct: number) => void
): Promise<{ videoId: string; message: string }> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const form = new FormData();

        form.append("title", title);
        form.append("description", description);
        form.append("isPublic", String(isPublic));
        form.append("videoFile", videoFile);

        if (subtitleFile) {
            form.append("subtitleFile", subtitleFile);
        }

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText));
            } else {
                reject(new Error(xhr.responseText || "Upload failed"));
            }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.withCredentials = true; // To wysyła ciasteczka!
        xhr.open("POST", `${BASE}/videos/upload`);
        xhr.send(form);
    });
}

export async function deleteVideo(id: string): Promise<void> {
    const res = await fetch(`${BASE}/videos/remove/${id}`, {
        method: "DELETE",
        credentials: "include"
    });
    if (!res.ok) throw new Error(await res.text());
}

export async function getCurrentUser(): Promise<{ id: string } | null> {
    const res = await fetch(`${BASE}/me`, {
        credentials: "include"
    });

    if (!res.ok) return null;
    return await res.json();
}

export function streamUrl(id: string): string {
    return `${BASE}/videos/stream/${id}/`;
}

// ==========================================
// 2. NOWE FUNKCJE PROFILU (Z ciasteczkami)
// ==========================================

export interface UserProfile {
    username: string;
    avatarUrl: string | null;
}

export const getUserProfile = async (): Promise<UserProfile> => {
    const res = await fetch(`${BASE}/profile/info`, {
        credentials: "include"
    });
    if (!res.ok) throw new Error("Błąd pobierania profilu");
    return res.json();
};

export const changeUsername = async (newUsername: string) => {
    const res = await fetch(`${BASE}/profile/change-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({ newUsername })
    });
    if (!res.ok) throw new Error("Ta nazwa użytkownika jest już zajęta lub niepoprawna.");
    return res.json();
};

export const changePassword = async (data: any) => {
    const res = await fetch(`${BASE}/profile/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Obecne hasło jest niepoprawne lub nowe jest za słabe.");
    return res.json();
};

export const uploadAvatar = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${BASE}/profile/avatar`, {
        method: 'POST',
        credentials: "include", // Ciasteczko logowania
        body: formData          // Zauważ brak Content-Type (przeglądarka ustawi to sama pod plik!)
    });

    if (!res.ok) throw new Error("Błąd wgrywania pliku.");
    return res.json();
};