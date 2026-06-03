import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getVideos, type Video } from "../api";


export default function Library() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        getVideos()
            .then(setVideos)
            .catch((e) => setError(e.message));
    }, []);
    
    if (error) return <p>Error: {error}</p>;
    if (!videos.length) return <p>No videos.</p>;

    return (
        <ul>
            {videos.map((v) => (
                <li key={v.id}>
                    <button onClick={() => navigate(`/player/${v.id}`)}>
                        {v.title}
                    </button>
                    {" "}{v.isPublic ? "public" : "private"}
                    {v.description && <span> — {v.description}</span>}
                </li>
            ))}
        </ul>
    );
}
 
 
