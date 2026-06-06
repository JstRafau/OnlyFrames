import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// Dodaj import getCurrentUser
import { getVideos, deleteVideo, getCurrentUser, type Video } from "../api";

export default function Library() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Dodajemy nowy stan na ID zalogowanego usera
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        // Pobieramy naraz i filmy, i dane użytkownika
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
            <div className="flex justify-center items-center h-64">
                <p className="text-lg text-gray-500 animate-pulse">Ładowanie biblioteki...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Błąd: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        );
    }

    if (!videos.length) {
        return (
            <div className="text-center py-12">
                <p className="text-xl text-gray-600">Brak wideo w bibliotece.</p>
                <p className="text-sm text-gray-400 mt-2">Wrzuć coś, żeby zacząć!</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Twoje Wideo</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((v) => {
                    const isReady = v.status === 'ready';
                    const isFailed = v.status === 'failed';

                    return (
                        <div key={v.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col border border-gray-200">

                            <div className="bg-gray-200 h-48 flex items-center justify-center relative">
                                {!isReady && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <span className="text-white font-semibold">
                                            {isFailed ? "Błąd przetwarzania" : "Przetwarzanie..."}
                                        </span>
                                    </div>
                                )}
                                <span className="text-gray-400">[Miniatura]</span>
                            </div>

                            <div className="p-4 flex flex-col flex-grow">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-gray-900 truncate" title={v.title}>
                                        {v.title}
                                    </h3>
                                    <span className={`text-xs px-2 py-1 rounded-full ${v.isPublic ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {v.isPublic ? "Publiczny" : "Prywatny"}
                                    </span>
                                </div>

                                {v.description && (
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-grow">
                                        {v.description}
                                    </p>
                                )}

                                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <span className={`text-xs font-bold ${
                                        isReady ? 'text-green-600' : isFailed ? 'text-red-600' : 'text-orange-500'
                                    }`}>
                                        {v.status.toUpperCase()}
                                    </span>

                                    <div className="flex gap-2">
                                        {/* Magia się dzieje tutaj: przycisk sprawdza prawdziwe ID z serwera */}
                                        {currentUserId === v.userId && (
                                            <button
                                                type="button"
                                                onClick={() => handleActionDelete(v.id, v.title)}
                                                className="px-3 py-2 rounded text-sm font-semibold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                                            >
                                                Usuń
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/player/${v.id}`)}
                                            disabled={!isReady}
                                            className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
                                                isReady
                                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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