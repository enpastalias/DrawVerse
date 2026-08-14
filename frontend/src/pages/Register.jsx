import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api.js';
import { AuthContext } from '../context/AuthContext.jsx';

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const { setUser } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/register', { username, email, password });
            setUser(res.data);
            localStorage.setItem('token', res.data.token);
            navigate('/lobby');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div style={{ padding: '60px 20px', display: 'flex', justifyContent: 'center' }}>
            <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h2>Register</h2>
                    <p style={{ color: '#6b7280', margin: 0 }}>Create a new DrawVerse account</p>
                </div>

                {error && <p style={{ color: '#dc2626', fontSize: '14px', textAlign: 'center', marginBottom: '20px' }}>{error}</p>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                            style={{ width: '100%' }}
                            placeholder="Your display name"
                        />
                    </div>

                    <div>
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            style={{ width: '100%' }}
                            placeholder="name@example.com"
                        />
                    </div>

                    <div>
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            style={{ width: '100%' }}
                            placeholder="Create a password"
                        />
                    </div>

                    <button type="submit" style={{ width: '100%', marginTop: '8px' }}>Register</button>
                </form>

                <p style={{ marginTop: '32px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}
