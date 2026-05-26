import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
            <h1>Welcome to OnlyFrames</h1>
            <p>Your ultimate video streaming platform</p>
            <Link to="/login">
                <button style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
                    Zaloguj się
                </button>
            </Link>
        </div>
    );
}