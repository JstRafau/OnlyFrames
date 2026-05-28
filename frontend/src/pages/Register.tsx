import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Register() {
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [error, setError] = useState<string>('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Hasła nie są identyczne!');
            return;
        }

        console.log('Rejestracja:', { username, email, password });
    };

    return (
        <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'sans-serif', color: '#fff' }}>
            <h2>Rejestracja</h2>

            {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <label>
                    Nazwa użytkownika:
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '5px', color: '#000' }} />
                </label>

                <label>
                    Email:
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '5px', color: '#000' }} />
                </label>

                <label>
                    Hasło:
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '5px', color: '#000' }} />
                </label>

                <label>
                    Powtórz hasło:
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '5px', color: '#000' }} />
                </label>

                <button type="submit" style={{ padding: '10px', cursor: 'pointer', color: '#000' }}>Zarejestruj się</button>
            </form>

            <p style={{ marginTop: '20px', textAlign: 'center' }}>
                Masz już konto? <Link to="/login">Zaloguj się</Link>
            </p>
        </div>
    );
}