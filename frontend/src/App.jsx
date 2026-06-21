import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Lobby from './pages/Lobby.jsx';
import Game from './pages/Game.jsx';
import Profile from './pages/Profile.jsx';
import { AuthContext } from './context/AuthContext.jsx';
import { useContext } from 'react';

const ProtectedRoute = ({ children }) => {
    const { user } = useContext(AuthContext);
    if (!user && !localStorage.getItem('token')) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

function App() {
    const { user, setUser } = useContext(AuthContext);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <div className="app-container" style={{ margin: '0 auto', maxWidth: '800px', padding: '1rem' }}>
            <nav style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', padding: '1rem', background: '#eee' }}>
                <strong>DrawVerse</strong>
                <Link to="/">Home</Link>
                <Link to="/lobby">Lobby</Link>
                {user ? (
                    <>
                        <Link to="/profile">Profile ({user.username})</Link>
                        <button onClick={handleLogout} style={{ border: 'none', background: 'none', color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}>Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </>
                )}
            </nav>

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/lobby" element={<Lobby />} />
                <Route path="/game/:roomCode" element={<Game />} />
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </div>
    );
}

export default App;
