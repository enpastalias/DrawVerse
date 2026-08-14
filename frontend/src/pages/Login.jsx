import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api.js';
import { AuthContext } from '../context/AuthContext.jsx';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const { setUser } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { email, password });
            setUser(res.data);
            localStorage.setItem('token', res.data.token);
            navigate('/lobby');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div style={{ padding: '60px 20px', display: 'flex', justifyContent: 'center' }}>
            <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h2>Login</h2>
                    <p style={{ color: '#6b7280', margin: 0 }}>Welcome back to DrawVerse</p>
                </div>

                {error && <p style={{ color: '#dc2626', fontSize: '14px', textAlign: 'center', marginBottom: '20px' }}>{error}</p>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                            placeholder="Enter your password"
                        />
                    </div>

                    <button type="submit" style={{ width: '100%', marginTop: '8px' }}>Login</button>
                </form>

                <p style={{ marginTop: '32px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </div>
        </div>
    );
}
