import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h2>Welcome to DrawVerse</h2>
                <p>The simplest real-time multiplayer drawing and guessing experience.</p>

                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <Link to="/lobby">
                        <button style={{ width: '100%', padding: '10px' }}>Enter Lobby</button>
                    </Link>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Link to="/login" style={{ flex: 1 }}>
                            <button style={{ width: '100%', backgroundColor: '#6c757d' }}>Login</button>
                        </Link>
                        <Link to="/register" style={{ flex: 1 }}>
                            <button style={{ width: '100%', backgroundColor: '#28a745' }}>Register</button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
