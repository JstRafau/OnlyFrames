const BASE = "/api";

export interface Video {
    id: string;
    title: string;
    description?: string; 
    isPublic: boolean;
    status: "processing" | "ready" | "failed"; 
    createdAt: string;
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

        xhr.withCredentials = true;

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

export function streamUrl(id: string): string {
    return `${BASE}/videos/stream/${id}/`;
}