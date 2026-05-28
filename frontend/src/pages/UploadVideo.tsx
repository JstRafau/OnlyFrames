import React, {useState} from 'react';

export default function UploadVideo() {
    const [title, setTitle] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [isPublic, setIsPublic] = useState<boolean>(true);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [message, setMessage] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!videoFile) {
            setMessage('Plik wideo jest wymagany!');
            return;
        }

        setMessage('Wysyłanie...');

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('isPublic', isPublic.toString());
        formData.append('videoFile', videoFile);

        if (subtitleFile) formData.append('subtitleFile', subtitleFile);
        if (thumbnailFile) formData.append('thumbnailFile', thumbnailFile);

        try {
            const response = await fetch('/api/videos/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                setMessage('Film został pomyślnie dodany!');
            } else {
                const errorData = await response.text();
                setMessage(`Błąd: ${errorData}`);
            }
        } catch (error) {
            setMessage('Błąd połączenia z serwerem.');
        }
    };

    return (
        <div style={{
            maxWidth: '500px',
            margin: '50px auto',
            padding: '20px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            color: '#fff'
        }}>
            <h2>Dodaj nowy film</h2>
            {message &&
                <p style={{fontWeight: 'bold', color: message.includes('Błąd') ? 'red' : 'green'}}>{message}</p>}

            <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                <label>
                    Tytuł:
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                           style={{width: '100%', padding: '8px', color: '#000'}}/>
                </label>

                <label>
                    Opis:
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                              style={{width: '100%', padding: '8px', color: '#000'}}/>
                </label>

                <label style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)}/>
                    Film publiczny
                </label>

                <label>
                    Plik Wideo (.mp4, .webm):
                    <input type="file" accept=".mp4,.webm" onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                           required style={{width: '100%', marginTop: '5px'}}/>
                </label>

                <label>
                    Napisy (.vtt) - opcjonalnie:
                    <input type="file" accept=".vtt" onChange={(e) => setSubtitleFile(e.target.files?.[0] || null)}
                           style={{width: '100%', marginTop: '5px'}}/>
                </label>

                <label>
                    Miniaturka (.jpg, .png) - opcjonalnie:
                    <input type="file" accept=".jpg,.jpeg,.png,.webp"
                           onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                           style={{width: '100%', marginTop: '5px'}}/>
                </label>

                <button type="submit"
                        style={{padding: '10px', cursor: 'pointer', color: '#000', fontWeight: 'bold'}}>Wgraj film
                </button>
            </form>
        </div>
    );
}