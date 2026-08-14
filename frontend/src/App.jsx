import React, { useContext } from 'react';
import { Routes, Route, Link, NavLink, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Lobby from './pages/Lobby.jsx';
import Game from './pages/Game.jsx';
import Profile from './pages/Profile.jsx';
import { AuthContext } from './context/AuthContext.jsx';

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

    const navLinkStyle = ({ isActive }) => ({
        textDecoration: 'none',
        color: isActive ? '#ffffff' : '#9ca3af',
        marginRight: '24px',
        fontWeight: '500',
        fontSize: '15px',
        borderBottom: 'none'
    });

    return (
        <div>
            <nav style={{ backgroundColor: '#1a1b1e', padding: '20px', marginBottom: '40px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <Link to="/" style={{ textDecoration: 'none', color: '#ffffff', fontSize: '24px', fontWeight: '700', letterSpacing: '-0.02em', borderBottom: 'none' }}>
                            DrawVerse
                        </Link>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <NavLink to="/" style={navLinkStyle}>Home</NavLink>
                        <NavLink to="/lobby" style={navLinkStyle}>Lobby</NavLink>

                        {user ? (
                            <>
                                <NavLink to="/profile" style={navLinkStyle}>
                                    {user.username}
                                </NavLink>
                                <button onClick={handleLogout} style={{ marginLeft: '12px', backgroundColor: '#ffffff', color: '#1a1b1e' }}>
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <NavLink to="/login" style={navLinkStyle}>Login</NavLink>
                                <Link to="/register" style={{ textDecoration: 'none', borderBottom: 'none' }}>
                                    <button style={{ marginLeft: '12px', backgroundColor: '#ffffff', color: '#1a1b1e' }}>Register</button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <main className="app-container">
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
            </main>
        </div>
    );
}

export default App;
