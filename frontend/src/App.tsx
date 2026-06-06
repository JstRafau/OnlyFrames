import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Library from './pages/Library';
import Upload from './pages/Upload'; // Dodany import nowej strony
import Player from './pages/Player';

export default function App() {
    return (
        <Router>
            <div className="min-h-screen bg-gray-50 flex flex-col">

                {/* --- Pasek nawigacji widoczny na każdej stronie --- */}
                <header className="bg-indigo-600 shadow-md">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center space-x-8">
                                <Link to="/" className="text-white font-bold text-xl tracking-wider">
                                    OnlyFrames
                                </Link>

                                <nav className="hidden md:flex space-x-4">
                                    <Link
                                        to="/"
                                        className="text-indigo-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        Strona Główna
                                    </Link>
                                    <Link
                                        to="/library"
                                        className="text-indigo-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        Biblioteka
                                    </Link>
                                    <Link
                                        to="/upload"
                                        className="text-indigo-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        Wgraj Wideo
                                    </Link>
                                </nav>
                            </div>

                            {/* Przyciski logowania / rejestracji */}
                            <div className="flex items-center space-x-4">
                                <Link to="/login" className="text-indigo-100 hover:text-white text-sm font-medium">
                                    Logowanie
                                </Link>
                                <Link to="/register" className="bg-white text-indigo-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                    Rejestracja
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>

                {/* --- Twoje routingi --- */}
                <main className="flex-grow">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/library" element={<Library />} />
                        <Route path="/upload" element={<Upload />} />
                        <Route path="/player/:videoGuid" element={<Player />} />

                        {/* Fallback dla nieznanych adresów */}
                        <Route path="*" element={
                            <div className="text-center mt-20 text-xl text-gray-600">
                                Nie znaleziono strony (404)
                            </div>
                        } />
                    </Routes>
                </main>

                {/* --- Stopka --- */}
                <footer className="bg-white border-t border-gray-200 mt-auto">
                    <div className="container mx-auto px-4 py-4 text-center text-sm text-gray-500">
                        &copy; 2026 OnlyFrames. Wszelkie prawa zastrzeżone.
                    </div>
                </footer>
            </div>
        </Router>
    );
}