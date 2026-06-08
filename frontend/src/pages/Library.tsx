import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getVideos, deleteVideo, getCurrentUser, getThumbUrl, type Video } from "../api";
import './Library.css';

export default function Library() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([
            getVideos(),
            getCurrentUser()
        ])
            .then(([videosData, userData]) => {
                setVideos(videosData);
                if (userData) {
                    setCurrentUserId(userData.id);
                }
                setIsLoading(false);
            })
            .catch((e) => {
                setError(e.message);
                setIsLoading(false);
            });
    }, []);

    const handleActionDelete = async (id: string, title: string) => {
        const confirmed = window.confirm(`Czy na pewno chcesz bezpowrotnie usunąć film: "${title}"?`);

        if (!confirmed) return;

        try {
            await deleteVideo(id);
            setVideos(prevVideos => prevVideos.filter(v => v.id !== id));
        } catch (e: any) {
            alert(`Nie udało się usunąć filmu: ${e.message}`);
        }
    };

    if (isLoading) {
        return (
            <div className="">
                <p className="">Ładowanie biblioteki...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="" role="alert">
                <strong className="">Błąd: </strong>
                <span className="">{error}</span>
            </div>
        );
    }

    if (!videos.length) {
        return (
            <div className="">
                <p className="">Brak wideo w bibliotece.</p>
                <p className="">Wrzuć coś, żeby zacząć!</p>
            </div>
        );
    }

    return (
        <div className="container">
            <h1 className="">Twoje Wideo</h1>

            <div className="">
                {videos.map((v) => {
                    const isReady = v.status === 'ready';
                    const isFailed = v.status === 'failed';

                    return (
                        <div key={v.id} className="entry">
                            <div>
                                <img className="thumbnail" src={getThumbUrl(v.id)}/>
                            </div>
                            <div className="desc">
                                <div className="top">
                                    <h2 title={v.title}>
                                        {v.title}
                                    </h2>
                                    {v.description && (
                                        <p className="">
                                            {v.description}
                                        </p>
                                    )}
                                    <span className={`${v.isPublic ? '' : ''}`}>
                                        {v.isPublic ? "Publiczny" : "Prywatny"}
                                    </span>
                                </div>

                                <div className="bottom margin-bottom">
                                    <span className={` ${
                                        isReady ? '' : isFailed ? '' : ''
                                    }`}>
                                        {v.status.toUpperCase()}
                                    </span>

                                    <div className="">
                                        {currentUserId === v.userId && (
                                            <button
                                                type="button"
                                                onClick={() => handleActionDelete(v.id, v.title)}
                                                className=""
                                            >
                                                Usuń
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/player/${v.id}`)}
                                            disabled={!isReady}
                                            className={` ${
                                                isReady
                                                    ? ''
                                                    : ''
                                            }`}
                                        >
                                            Odtwórz
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}