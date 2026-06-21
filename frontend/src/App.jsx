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

    // Inline SVG Icon elements
    const brushIcon = (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M7.5 10.5c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5z" />
            <path d="M11.5 7.5c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5z" />
            <path d="M16.5 9.5c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5z" />
            <path d="M6 14c0-2 2-3 4-3 2.5 0 3.5 1.5 4.5 3.5.5 1 1.5 1.5 2.5 1.5h1" />
        </svg>
    );

    const navLinkStyle = ({ isActive }) => ({
        textDecoration: 'none',
        color: isActive ? 'var(--color-primary-hover)' : 'var(--text-muted)',
        fontWeight: '700',
        fontSize: '0.95rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: '0.5rem 1rem',
        borderRadius: 'var(--radius-sm)',
        transition: 'all 0.2s ease',
        background: isActive ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
        border: isActive ? '1px solid rgba(139, 92, 246, 0.15)' : '1px solid transparent',
        display: 'inline-flex',
        alignItems: 'center'
    });

    return (
        <div className="app-container" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
            <nav style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                margin: '1.5rem 0 2rem 0',
                padding: '1rem 1.5rem',
                background: 'var(--bg-surface)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
                position: 'sticky',
                top: '15px',
                zIndex: 99
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Link to="/" style={{
                        display: 'flex',
                        alignItems: 'center',
                        textDecoration: 'none',
                        color: '#fff',
                        fontSize: '1.4rem',
                        fontWeight: '800',
                        letterSpacing: '-0.03em',
                        textTransform: 'uppercase',
                    }}>
                        <span style={{
                            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            {brushIcon}
                            DrawVerse
                        </span>
                    </Link>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <NavLink to="/" style={navLinkStyle}>Home</NavLink>
                    <NavLink to="/lobby" style={navLinkStyle}>Lobby</NavLink>
                    
                    {user ? (
                        <>
                            <NavLink to="/profile" style={navLinkStyle}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginBottom: '-1px' }}>
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    {user.username}
                                </span>
                            </NavLink>
                            <button 
                                onClick={handleLogout} 
                                style={{
                                    background: 'rgba(239, 68, 68, 0.08)',
                                    color: 'var(--color-danger)',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    padding: '0.5rem 1rem',
                                    borderRadius: 'var(--radius-sm)',
                                    transition: 'all 0.2s ease',
                                    border: '1px solid rgba(239, 68, 68, 0.15)',
                                    fontSize: '0.85rem'
                                }}
                                onMouseOver={e => {
                                    e.target.style.background = 'rgba(239, 68, 68, 0.15)';
                                    e.target.style.transform = 'translateY(-1px)';
                                }}
                                onMouseOut={e => {
                                    e.target.style.background = 'rgba(239, 68, 68, 0.08)';
                                    e.target.style.transform = 'none';
                                }}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <NavLink to="/login" style={navLinkStyle}>Login</NavLink>
                            <NavLink to="/register" style={navLinkStyle}>Register</NavLink>
                        </>
                    )}
                </div>
            </nav>

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
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
