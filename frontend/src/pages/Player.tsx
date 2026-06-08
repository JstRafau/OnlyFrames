import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Hls from "hls.js";
type SubtitleTrack = Hls["subtitleTracks"][number];
import { streamUrl } from "../api";

export default function Player() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
    const [activeTrack, setActiveTrack] = useState<number>(-1);
    const [levels, setLevels] = useState<{ height: number; bitrate: number }[]>([]);
    const [currentLevel, setCurrentLevel] = useState<number>(-1);
    const { videoGuid } = useParams<{ videoGuid: string }>();

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        if (!videoGuid) return;
        
        if (Hls.isSupported()) {
            var hls = new Hls({
                enableWebVTT: true,
                enableCEA708Captions: true,
                maxBufferLength: 30,
                maxMaxBufferLength: 600,
                startLevel: -1,
                capLevelToPlayerSize: true,
            });

            hlsRef.current = hls;
            hls.loadSource(streamUrl(videoGuid));
            hls.attachMedia(video);

            hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (_, data) => {
                setSubtitleTracks(data.subtitleTracks);
            });

            hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, (_, data) => {
                setActiveTrack(data.id);
            });
            hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
                setLevels(data.levels);
            });
            hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
                setCurrentLevel(data.level);
            });

            return () => hls.destroy();
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = streamUrl(videoGuid);
        }
    }, [videoGuid]);

    function switchTrack(id: number) {
        if (!hlsRef.current) return;
        hlsRef.current.subtitleTrack = id;
        setActiveTrack(id);
    }

    return (
        <div>
            <video
                ref={videoRef}
                controls
                width="1280"
                height="720"
                style={{ display: "block", background: "#000" }}
            />
            {subtitleTracks.length > 0 && (
                <div>
                    <button onClick={() => switchTrack(-1)}>Off</button>
                    {subtitleTracks.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => switchTrack(t.id)}
                            style={{ fontWeight: activeTrack === t.id ? "bold" : "normal" }}
                        >
                            {t.name || t.lang || `Track ${t.id}`}
                        </button>
                    ))}
                </div>
            )}
            {levels.length > 0 && (
                <div>
                    <button
                        onClick={() => { hlsRef.current!.currentLevel = -1; setCurrentLevel(-1); }}
                        style={{ fontWeight: currentLevel === -1 ? "bold" : "normal" }}
                    >
                        Auto
                    </button>
                    {levels.map((l, i) => (
                        <button
                            key={i}
                            onClick={() => { hlsRef.current!.currentLevel = i; setCurrentLevel(i); }}
                            style={{ fontWeight: currentLevel === i ? "bold" : "normal" }}
                        >
                            {l.height}p
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}