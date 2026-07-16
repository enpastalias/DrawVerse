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

    const navLinkStyle = {
        textDecoration: 'none',
        color: '#007bff',
        marginRight: '15px',
        fontWeight: 'bold'
    };

    return (
        <div className="app-container">
            <nav className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', marginBottom: '20px' }}>
                <div>
                    <Link to="/" style={{ textDecoration: 'none', color: '#333', fontSize: '24px', fontWeight: 'bold' }}>
                        DrawVerse
                    </Link>
                </div>

                <div>
                    <NavLink to="/" style={navLinkStyle}>Home</NavLink>
                    <NavLink to="/lobby" style={navLinkStyle}>Lobby</NavLink>

                    {user ? (
                        <>
                            <NavLink to="/profile" style={navLinkStyle}>
                                {user.username}
                            </NavLink>
                            <button onClick={handleLogout} style={{ backgroundColor: '#dc3545', padding: '5px 10px', fontSize: '14px' }}>
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

            <main>
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
