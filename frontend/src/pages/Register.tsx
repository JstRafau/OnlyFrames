import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');

    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Hook do przekierowań
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Hasła nie są identyczne!');
            return;
        }

        setIsLoading(true);

        try {
            // Pobieramy adres URL API ze zmiennych środowiskowych Vite
            const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

            const response = await fetch(`${baseUrl}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            // Próbujemy wyciągnąć dane z odpowiedzi
            const data = await response.json().catch(() => null);

            if (!response.ok) {
                // Obsługa błędów z ASP.NET Core Identity (tablica błędów)
                if (Array.isArray(data)) {
                    // Łączymy wszystkie opisy błędów (np. za krótkie hasło, brak dużej litery)
                    const errorMessages = data.map((err: any) => err.description).join(' ');
                    setError(errorMessages);
                } else if (data && data.message) {
                    setError(data.message);
                } else {
                    setError('Wystąpił błąd podczas rejestracji. Spróbuj ponownie.');
                }
                return;
            }

            // Sukces! Przekierowujemy na stronę logowania i przekazujemy wiadomość o sukcesie
            navigate('/login', {
                state: { successMessage: 'Zarejestrowano pomyślnie! Możesz się teraz zalogować.' }
            });

        } catch (err) {
            console.error('Błąd połączenia:', err);
            setError('Błąd połączenia z serwerem. Upewnij się, że backend działa.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // Zmieniono na białe tło (minHeight: 100vh sprawia, że tło rozciąga się na cały ekran)
        <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {/* Sam formularz ma delikatnie szare tło dla kontrastu */}
            <div style={{ width: '100%', maxWidth: '400px', padding: '30px', backgroundColor: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: '8px', fontFamily: 'sans-serif', color: '#333', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#111' }}>Rejestracja</h2>

                {/* Wyświetlanie błędów - czerwone tło, ciemnoczerwony tekst */}
                {error && (
                    <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px', lineHeight: '1.4' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '14px' }}>
                        Nazwa użytkownika:
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', color: '#000', boxSizing: 'border-box' }}
                        />
                    </label>

                    <label style={{ fontWeight: 'bold', fontSize: '14px' }}>
                        Email:
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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

                    <label style={{ fontWeight: 'bold', fontSize: '14px' }}>
                        Powtórz hasło:
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', color: '#000', boxSizing: 'border-box' }}
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{ padding: '12px', marginTop: '10px', cursor: isLoading ? 'not-allowed' : 'pointer', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '16px' }}
                    >
                        {isLoading ? 'Przetwarzanie...' : 'Zarejestruj się'}
                    </button>
                </form>

                <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
                    Masz już konto? <Link to="/login" style={{ color: '#007bff', textDecoration: 'none' }}>Zaloguj się</Link>
                </p>
            </div>
        </div>
    );
}