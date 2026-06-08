import { useState, type DragEvent, type FormEvent } from "react";
import { uploadVideo } from "../api";
import { useNavigate } from "react-router-dom";
import './Upload.css'

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
        <div className="content">
            <h1 className="">Wgraj nowe wideo</h1>

            {status === "success" && (
                <div className="">
                    Wgrywanie zakończone sukcesem! Trwa przetwarzanie w tle... Za chwilę wrócisz do biblioteki.
                </div>
            )}

            {status === "error" && (
                <div className="">
                    {errorMessage}
                </div>
            )}

            <form onSubmit={handleSubmit} >

                <div className="margin-bottom">
                    <label className="block">Tytuł *</label>
                    <input
                        type="text"
                        required
                        maxLength={100}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={status === "uploading" || status === "success"}
                        className=""
                        placeholder="Np. Wakacje w górach 2026"
                        style={{width:'100%'}}
                    />
                </div>

                <div className="margin-bottom">
                    <label className="block">Opis (Opcjonalny)</label>
                    <textarea
                        maxLength={1000}
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={status === "uploading" || status === "success"}
                        className=""
                        placeholder="Krótki opis tego, co dzieje się na filmie..."
                        style={{width:'100%'}}
                    />
                </div>

                <div className="flex items-center margin-bottom">
                    <input
                        type="checkbox"
                        id="isPublic"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        disabled={status === "uploading" || status === "success"}
                        className=""
                    />
                    <label htmlFor="isPublic" className="block">
                        Film publiczny (widoczny dla wszystkich)
                    </label>
                </div>

                <div className="flex flex-wrap gap-6 justify-center margin-bottom">

                    <div className="flex flex-col items-center">
                        <span className="block">Plik Wideo *</span>
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
                            <svg className="icon" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="">Wybierz plik</span>
                            <span className="">lub upuść tutaj</span>

                            <span className="">
                                {videoFile ? <span className="">{videoFile.name}</span> : "MP4, WEBM, MKV"}
                            </span>
                        </label>
                    </div>

                    <div className="flex flex-col items-center margin-bottom">
                        <span className="block">Napisy (Opcjonalnie)</span>
                        <label
                            onDragOver={(e) => { e.preventDefault(); setIsSubDragging(true); }}
                            onDragLeave={() => setIsSubDragging(false)}
                            onDrop={handleSubtitleDrop}
                            className={`w-[200px] h-[200px] flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md transition-colors cursor-pointer text-center ${
                                isSubDragging ? "" : ""
                            } ${status === "uploading" ? "" : ""}`}
                        >
                            <input
                                type="file"
                                accept=".vtt"
                                className="sr-only"
                                onChange={(e) => setSubtitleFile(e.target.files?.[0] || null)}
                                disabled={status === "uploading" || status === "success"}
                            />
                            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <span className="">Wybierz .vtt</span>
                            <span className="">lub upuść tutaj</span>

                            <span className="">
                                {subtitleFile ? <span className="">{subtitleFile.name}</span> : "Tylko pliki VTT"}
                            </span>
                        </label>
                    </div>

                </div>

                {status === "uploading" && (
                    <div className="">
                        <div
                            className=""
                            style={{ width: `${progress}%` }}
                        >
                            {progress > 5 ? `${progress}%` : ''}
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={status === "uploading" || status === "success" || !videoFile}
                    className={` ${
                        status === "uploading" || !videoFile
                            ? ""
                            : ""
                    }`}
                >
                    {status === "uploading" ? "Wgrywanie na serwer..." : "Rozpocznij wgrywanie"}
                </button>
            </form>
        </div>
    );
}