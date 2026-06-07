import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserProfile, changeUsername, changePassword, uploadAvatar, type UserProfile } from "../api";


export default function Account() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [newUsername, setNewUsername] = useState("");
    const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [message, setMessage] = useState({ text: "", isError: false });

    const navigate = useNavigate();

    useEffect(() => {
        refreshProfile();
    }, [navigate]);

    const refreshProfile = () => {
        getUserProfile()
            .then(setProfile)
            .catch(() => navigate("/login"));
    };

    const handleAction = async (action: () => Promise<any>, successMsg: string) => {
        try {
            await action();
            setMessage({ text: successMsg, isError: false });

            setAvatarFile(null);
            setNewUsername("");
            setPasswords({ currentPassword: "", newPassword: "" });

            refreshProfile();
        } catch (err) {
            setMessage({ text: (err as Error).message, isError: true });
        }
    };

    if (!profile) return <div className="text-center p-8 text-white">Ładowanie...</div>;

    const fullAvatarUrl = profile.avatarUrl ? profile.avatarUrl : null;

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl text-white">
            <h1 className="text-3xl font-bold mb-8">Ustawienia Konta</h1>

            {message.text && (
                <div className={`mb-6 p-4 rounded-lg ${message.isError ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}>
                    {message.text}
                </div>
            )}

            <div className="space-y-8">
                {/* SEKCJA AWATARA */}
                <section className="bg-gray-800 p-6 rounded-xl">
                    <div className="flex items-center gap-6 mb-4">

                        {/* Wymuszenie sztywnego, małego rozmiaru (zmniejszony o 3/4) za pomocą stylów inline */}
                        <div style={{
                            width: '96px',
                            height: '96px',
                            borderRadius: '50%',
                            backgroundColor: '#374151',
                            overflow: 'hidden',
                            border: '3px solid #6366f1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            {fullAvatarUrl ? (
                                <img
                                    src={fullAvatarUrl}
                                    alt="Avatar"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                    onError={(e) => {
                                        // Zabezpieczenie: jeśli backend nie odpowie, ładujemy mały placeholder
                                        (e.target as HTMLImageElement).src = "https://www.w3schools.com/howto/img_avatar.png";
                                    }}
                                />
                            ) : (
                                <div style={{ fontSize: '1.875rem' }}>👤</div>
                            )}
                        </div>

                        <div className="flex-grow">
                            <h3 className="text-lg font-bold mb-2">Wgraj z dysku</h3>
                            <div className="flex gap-2">
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg, image/webp"
                                    className="flex-grow text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                                    onChange={(e) => setAvatarFile(e.target.files ? e.target.files[0] : null)}
                                />
                                <button
                                    onClick={() => handleAction(() => uploadAvatar(avatarFile!), "Awatar wgrany!")}
                                    disabled={!avatarFile}
                                    className="bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                                >
                                    Wgraj
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SEKCJA NICKU */}
                <section className="bg-gray-800 p-6 rounded-xl">
                    <h3 className="text-lg font-bold mb-2">Obecny nick: <span className="text-indigo-400">{profile.username}</span></h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="flex-grow px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-indigo-500"
                            placeholder="Nowy nick..."
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                        />
                        <button
                            onClick={() => handleAction(() => changeUsername(newUsername), "Nick zmieniony!")}
                            disabled={!newUsername}
                            className="bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                            Zmień
                        </button>
                    </div>
                </section>

                {/* SEKCJA HASŁA */}
                <section className="bg-gray-800 p-6 rounded-xl space-y-4">
                    <h3 className="text-lg font-bold">Zmień hasło</h3>
                    <input
                        type="password"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-indigo-500"
                        placeholder="Obecne hasło"
                        value={passwords.currentPassword}
                        onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    />
                    <input
                        type="password"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-indigo-500"
                        placeholder="Nowe hasło"
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    />
                    <button
                        onClick={() => handleAction(() => changePassword(passwords), "Hasło zmienione!")}
                        disabled={!passwords.currentPassword || !passwords.newPassword}
                        className="w-full bg-gray-700 border border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
                    >
                        Zmień hasło
                    </button>
                </section>
            </div>
        </div>
    );
}