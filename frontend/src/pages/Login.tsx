import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

/**
 * Renders the user login form.
 * Authenticates the user via the backend API using either an email or username.
 * Displays success messages passed from the registration process.
 * On success, redirects the user to the library page.
 * * @returns {JSX.Element} The login page component.
 */
export default function Login() {
    const [loginOrEmail, setLoginOrEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const navigate = useNavigate();
    const location = useLocation();

    const successMessage = location.state?.successMessage as string | undefined;

    /**
     * Handles the form submission event.
     * Sends the login payload to the API and processes the authentication response.
     * * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
     */
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
                credentials: 'include',
                body: JSON.stringify({ loginOrEmail, password }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                if (data && data.message) {
                    setError(data.message);
                } else {
                    setError('Invalid username/email or password.');
                }
                return;
            }

            navigate('/library');

        } catch (err) {
            console.error('Connection error:', err);
            setError('Failed to connect to the server. Make sure the backend is running.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            <div style={{ width: '100%', maxWidth: '400px', padding: '30px', backgroundColor: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: '8px', fontFamily: 'sans-serif', color: '#333', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#111' }}>Login</h2>

                {successMessage && (
                    <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px', lineHeight: '1.4', border: '1px solid #bbf7d0' }}>
                        {successMessage}
                    </div>
                )}

                {error && (
                    <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px', lineHeight: '1.4' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '14px' }}>
                        Username or Email:
                        <input
                            type="text"
                            value={loginOrEmail}
                            onChange={(e) => setLoginOrEmail(e.target.value)}
                            required
                            style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', color: '#000', boxSizing: 'border-box' }}
                        />
                    </label>

                    <label style={{ fontWeight: 'bold', fontSize: '14px' }}>
                        Password:
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
                        {isLoading ? 'Logging in...' : 'Log in'}
                    </button>
                </form>

                <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
                    Don't have an account? <Link to="/register" style={{ color: '#007bff', textDecoration: 'none' }}>Sign up</Link>
                </p>
            </div>
        </div>
    );
}