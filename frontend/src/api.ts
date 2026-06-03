const BASE = "/api";

export interface Video {
    id: string;
    title: string;
    description: string;
    isPublic: boolean;
    status: "transcoding" | "ready" | "failed";
    createdAt: string;
}

export async function getVideos(): Promise<Video[]> {
    const res = await fetch(`${BASE}/videos/all`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function uploadVideo(
    file: File,
    onProgress: (pct: number) => void
): Promise<{ videoId: string; status: string }> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const form = new FormData();
        form.append("file", file);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
            else reject(new Error(xhr.responseText));
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.open("POST", `${BASE}/videos/upload`);
        xhr.send(form);
    });
}

export async function deleteVideo(id: string): Promise<void> {
    const res = await fetch(`${BASE}/videos/remove/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
}

export function streamUrl(id: string): string {
    return `${BASE}/videos/stream/${id}/`;
}
