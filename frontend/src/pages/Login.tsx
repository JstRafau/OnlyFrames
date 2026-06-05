import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Login() {
    const [loginOrEmail, setLoginOrEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const navigate = useNavigate();
    const location = useLocation();

    // Przechwytujemy wiadomość o sukcesie przekazaną z komponentu Register
    const successMessage = location.state?.successMessage as string | undefined;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

            const response = await fetch(`${baseUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ loginOrEmail, password }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                // Wyświetlamy konkretny błąd z Twojego backendu (Invalid username/email or password)
                if (data && data.message) {
                    setError(data.message);
                } else {
                    setError('Nieprawidłowa nazwa użytkownika/email lub hasło.');
                }
                return;
            }

            // Sukces logowania - kierujemy do biblioteki
            navigate('/library');

        } catch (err) {
            console.error('Błąd połączenia:', err);
            setError('Błąd połączenia z serwerem. Upewnij się, że backend działa.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            <div style={{ width: '100%', maxWidth: '400px', padding: '30px', backgroundColor: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: '8px', fontFamily: 'sans-serif', color: '#333', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#111' }}>Logowanie</h2>

                {/* Wiadomość o pomyślnej rejestracji (Toast) */}
                {successMessage && (
                    <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px', lineHeight: '1.4', border: '1px solid #bbf7d0' }}>
                        {successMessage}
                    </div>
                )}

                {/* Komunikaty błędów z backendu */}
                {error && (
                    <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px', lineHeight: '1.4' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '14px' }}>
                        Nazwa użytkownika lub Email:
                        <input
                            type="text"
                            value={loginOrEmail}
                            onChange={(e) => setLoginOrEmail(e.target.value)}
                            required
                            style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', color: '#000', boxSizing: 'border-box' }}
                        />
                    </label>

                    <label style={{ fontWeight: 'bold', fontSize: '14px' }}>
                        Hasło:
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', color: '#000', boxSizing: 'border-box' }}
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{ padding: '12px', marginTop: '10px', cursor: isLoading ? 'not-allowed' : 'pointer', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '16px' }}
                    >
                        {isLoading ? 'Logowanie...' : 'Zaloguj się'}
                    </button>
                </form>

                <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
                    Nie masz konta? <Link to="/register" style={{ color: '#007bff', textDecoration: 'none' }}>Zarejestruj się</Link>
                </p>
            </div>
        </div>
    );
}