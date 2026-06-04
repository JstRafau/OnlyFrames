import { useEffect, useRef } from "react";
import Hls from "hls.js";
import { streamUrl } from "../api";

interface Props {
    videoId: string;
}

export default function VideoPlayer({ videoId }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const src = streamUrl(videoId);

        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(src);
            hls.attachMedia(video);
            return () => hls.destroy();
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            // Safari native HLS
            video.src = src;
        }
    }, [videoId]);

    return (
        <video
            ref={videoRef}
            controls
            width="1280"
            height="720"
            style={{ display: "block", background: "#000" }}
        />
    );
}
 
