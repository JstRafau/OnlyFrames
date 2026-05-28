import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Login() {
    const [loginOrEmail, setLoginOrEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log('Logowanie:', { loginOrEmail, password });
    };

    return (
        <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'sans-serif', color: '#fff' }}>
            <h2>Logowanie</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <label>
                    Nazwa użytkownika lub Email:
                    <input type="text" value={loginOrEmail} onChange={(e) => setLoginOrEmail(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '5px', color: '#000' }} />
                </label>

                <label>
                    Hasło:
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '5px', color: '#000' }} />
                </label>

                <button type="submit" style={{ padding: '10px', cursor: 'pointer', color: '#000' }}>Zaloguj się</button>
            </form>

            <p style={{ marginTop: '20px', textAlign: 'center' }}>
                Nie masz konta? <Link to="/register">Zarejestruj się</Link>
            </p>
        </div>
    );
}