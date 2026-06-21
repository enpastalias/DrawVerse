import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api.js';
import { AuthContext } from '../context/AuthContext.jsx';
import Card from '../components/Card';
import Button from '../components/Button';

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
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            padding: '2rem 0',
            animation: 'fadeIn 0.5s ease-out forwards'
        }}>
            <Card style={{ maxWidth: '400px', width: '100%', padding: '2.5rem 2rem' }}>
                <h2 style={{ 
                    fontSize: '2rem', 
                    fontWeight: '800', 
                    letterSpacing: '-0.02em', 
                    marginBottom: '0.5rem',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #fff 50%, var(--color-primary-hover) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Welcome Back
                </h2>
                <p style={{ 
                    color: 'var(--text-muted)', 
                    fontSize: '0.9rem', 
                    textAlign: 'center', 
                    marginBottom: '1.5rem' 
                }}>
                    Sign in to your account to save your matches
                </p>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1.5px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.75rem 1rem',
                        color: '#f87171',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        marginBottom: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                            Email Address
                        </label>
                        <input 
                            type="email" 
                            placeholder="name@domain.com" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            required 
                        />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                            Password
                        </label>
                        <input 
                            type="password" 
                            placeholder="••••••••" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            required 
                        />
                    </div>

                    <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}>
                        Login
                    </Button>
                </form>

                <p style={{ 
                    color: 'var(--text-muted)', 
                    fontSize: '0.875rem', 
                    textAlign: 'center', 
                    marginTop: '1.5rem',
                    fontWeight: '500'
                }}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: 'var(--color-primary-hover)', textDecoration: 'none', fontWeight: '700' }}>
                        Register
                    </Link>
                </p>
            </Card>
        </div>
    );
}
