import { useState, type DragEvent, type FormEvent } from "react";
import { uploadVideo } from "../api";
import { useNavigate } from "react-router-dom";

export default function Upload() {
    const navigate = useNavigate();

    // Stan formularza
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(false);

    // Stan plików
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [subtitleFile, setSubtitleFile] = useState<File | null>(null);

    // Stany wizualne dla Drag & Drop
    const [isVideoDragging, setIsVideoDragging] = useState(false);
    const [isSubDragging, setIsSubDragging] = useState(false);

    // Stan wysyłania
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [progress, setProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState("");

    // Obsługa Drag & Drop dla wideo
    const handleVideoDrop = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsVideoDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setVideoFile(e.dataTransfer.files[0]);
        }
    };

    // Obsługa Drag & Drop dla napisów
    const handleSubtitleDrop = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsSubDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setSubtitleFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!videoFile) {
            setErrorMessage("Plik wideo jest wymagany!");
            setStatus("error");
            return;
        }

        setStatus("uploading");
        setProgress(0);
        setErrorMessage("");

        try {
            await uploadVideo(
                title,
                description,
                isPublic,
                videoFile,
                subtitleFile,
                (pct) => setProgress(pct)
            );

            setStatus("success");
            setTimeout(() => navigate("/"), 2000);
        } catch (error: any) {
            setStatus("error");
            setErrorMessage(error.message || "Wystąpił błąd podczas wgrywania pliku.");
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Wgraj nowe wideo</h2>

            {status === "success" && (
                <div className="mb-6 p-4 bg-green-100 text-green-700 rounded border border-green-300">
                    Wgrywanie zakończone sukcesem! Trwa przetwarzanie w tle... Za chwilę wrócisz do biblioteki.
                </div>
            )}

            {status === "error" && (
                <div className="mb-6 p-4 bg-red-100 text-red-700 rounded border border-red-300">
                    {errorMessage}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* --- SEKCJA METADANYCH --- */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tytuł *</label>
                    <input
                        type="text"
                        required
                        maxLength={100}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={status === "uploading" || status === "success"}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                        placeholder="Np. Wakacje w górach 2026"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Opis (Opcjonalny)</label>
                    <textarea
                        maxLength={1000}
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={status === "uploading" || status === "success"}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                        placeholder="Krótki opis tego, co dzieje się na filmie..."
                    />
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="isPublic"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        disabled={status === "uploading" || status === "success"}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
                        Film publiczny (widoczny dla wszystkich)
                    </label>
                </div>

                {/* --- SEKCJA DRAG & DROP --- */}
                <div className="flex flex-wrap gap-6 justify-center pt-2">

                    {/* WIDEO BOX (200x200) */}
                    <div className="flex flex-col items-center">
                        <span className="block text-sm font-medium text-gray-700 mb-2">Plik Wideo *</span>
                        <label
                            onDragOver={(e) => { e.preventDefault(); setIsVideoDragging(true); }}
                            onDragLeave={() => setIsVideoDragging(false)}
                            onDrop={handleVideoDrop}
                            className={`w-[200px] h-[200px] flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md transition-colors cursor-pointer text-center ${
                                isVideoDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-gray-400"
                            } ${status === "uploading" ? "opacity-50 pointer-events-none" : ""}`}
                        >
                            <input
                                type="file"
                                accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                                className="sr-only"
                                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                                disabled={status === "uploading" || status === "success"}
                            />
                            <svg className="h-10 w-10 text-indigo-400 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="text-sm font-medium text-indigo-600">Wybierz plik</span>
                            <span className="text-xs text-gray-500 mt-1">lub upuść tutaj</span>

                            <span className="mt-3 text-xs text-gray-500 truncate w-full px-2 font-semibold">
                                {videoFile ? <span className="text-indigo-600">{videoFile.name}</span> : "MP4, WEBM, MKV"}
                            </span>
                        </label>
                    </div>

                    {/* NAPISY BOX (200x200) */}
                    <div className="flex flex-col items-center">
                        <span className="block text-sm font-medium text-gray-700 mb-2">Napisy (Opcjonalnie)</span>
                        <label
                            onDragOver={(e) => { e.preventDefault(); setIsSubDragging(true); }}
                            onDragLeave={() => setIsSubDragging(false)}
                            onDrop={handleSubtitleDrop}
                            className={`w-[200px] h-[200px] flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md transition-colors cursor-pointer text-center ${
                                isSubDragging ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-gray-400"
                            } ${status === "uploading" ? "opacity-50 pointer-events-none" : ""}`}
                        >
                            <input
                                type="file"
                                accept=".vtt"
                                className="sr-only"
                                onChange={(e) => setSubtitleFile(e.target.files?.[0] || null)}
                                disabled={status === "uploading" || status === "success"}
                            />
                            <svg className="h-10 w-10 text-green-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <span className="text-sm font-medium text-green-600">Wybierz .vtt</span>
                            <span className="text-xs text-gray-500 mt-1">lub upuść tutaj</span>

                            <span className="mt-3 text-xs text-gray-500 truncate w-full px-2 font-semibold">
                                {subtitleFile ? <span className="text-green-600">{subtitleFile.name}</span> : "Tylko pliki VTT"}
                            </span>
                        </label>
                    </div>

                </div>

                {/* --- PASEK POSTĘPU WGRYWANIA --- */}
                {status === "uploading" && (
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden shadow-inner mt-4">
                        <div
                            className="bg-indigo-600 h-4 rounded-full transition-all duration-300 ease-out flex items-center justify-center text-[10px] text-white font-bold"
                            style={{ width: `${progress}%` }}
                        >
                            {progress > 5 ? `${progress}%` : ''}
                        </div>
                    </div>
                )}

                {/* --- PRZYCISK SUBMIT --- */}
                <button
                    type="submit"
                    disabled={status === "uploading" || status === "success" || !videoFile}
                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white mt-4 ${
                        status === "uploading" || !videoFile
                            ? "bg-indigo-400 cursor-not-allowed"
                            : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    }`}
                >
                    {status === "uploading" ? "Wgrywanie na serwer..." : "Rozpocznij wgrywanie"}
                </button>
            </form>
        </div>
    );
}