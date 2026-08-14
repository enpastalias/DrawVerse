import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div style={{ padding: '60px 20px', display: 'flex', justifyContent: 'center' }}>
            <div className="card" style={{ width: '100%', maxWidth: '600px', textAlign: 'center' }}>
                <h2>Welcome to DrawVerse</h2>
                <p style={{ color: '#6b7280', fontSize: '18px', margin: '0 0 40px 0' }}>The simplest real-time multiplayer drawing and guessing experience.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Link to="/lobby" style={{ textDecoration: 'none', borderBottom: 'none' }}>
                        <button style={{ width: '100%' }}>Enter Lobby</button>
                    </Link>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Link to="/login" style={{ flex: 1, textDecoration: 'none', borderBottom: 'none' }}>
                            <button className="button-secondary" style={{ width: '100%' }}>Login</button>
                        </Link>
                        <Link to="/register" style={{ flex: 1, textDecoration: 'none', borderBottom: 'none' }}>
                            <button className="button-secondary" style={{ width: '100%' }}>Register</button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
