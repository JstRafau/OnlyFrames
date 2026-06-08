import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css'
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Library from './pages/Library';
import Upload from './pages/Upload';
import Player from './pages/Player';
import Account from "./pages/Account";


export default function App() {
    return (
        <Router>
            <div className="app-container">
                <header className="app-header">
                        <Link to="/">
                            OnlyFrames
                        </Link>
                        <nav>
                            <Link to="/library">
                                Biblioteka
                            </Link>
                            <Link to="/upload">
                                Wgraj Wideo
                            </Link>
                            <Link to="/account">
                                Moje konto
                            </Link>
                            <Link to="/login">
                                Logowanie
                            </Link>
                            <Link to="/register">
                                Rejestracja
                            </Link>
                        </nav>
                </header>

                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/library" element={<Library />} />
                        <Route path="/upload" element={<Upload />} />
                        <Route path="/player/:videoGuid" element={<Player />} />
                        <Route path="/account" element={<Account />} />

                        <Route path="*" element={
                            <div>
                                Nie znaleziono strony (404)
                            </div>
                        } />
                    </Routes>
                </main>

                <footer className="app-footer">
                    <p>
                        &copy; 2026 OnlyFrames. Wszelkie prawa zastrzeżone.
                    </p>
                </footer>
            </div>
        </Router>
    );
}