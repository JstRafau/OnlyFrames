import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * Renders the user registration form.
 * Handles user input validation and submits the registration payload to the backend API.
 * On success, redirects the user to the login page with a success message.
 * * @returns {JSX.Element} The registration page component.
 */
export default function Register() {
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');

    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const navigate = useNavigate();

    /**
     * Handles the form submission event.
     * Validates passwords, sends the request to the API, and processes the response.
     * * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
     */
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match!');
            return;
        }

        setIsLoading(true);

        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

            const response = await fetch(`${baseUrl}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                if (Array.isArray(data)) {
                    const errorMessages = data.map((err: any) => err.description).join(' ');
                    setError(errorMessages);
                } else if (data && data.message) {
                    setError(data.message);
                } else {
                    setError('An error occurred during registration. Please try again.');
                }
                return;
            }

            navigate('/login', {
                state: { successMessage: 'Registered successfully! You can now log in.' }
            });

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
            <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#111' }}>Registration</h2>

            {error && (
                <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px', lineHeight: '1.4' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <label style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    Username:
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
                    Password:
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', color: '#000', boxSizing: 'border-box' }}
                    />
                </label>

                <label style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    Confirm Password:
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
                    {isLoading ? 'Processing...' : 'Sign up'}
                </button>
            </form>

            <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
                Already have an account? <Link to="/login" style={{ color: '#007bff', textDecoration: 'none' }}>Log in</Link>
            </p>
        </div>
    </div>
);
}