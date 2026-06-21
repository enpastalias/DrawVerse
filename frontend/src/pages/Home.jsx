import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div style={{ padding: '2rem', textAlign: 'center', border: '1px solid #ddd' }}>
            <h1>Welcome to DrawVerse</h1>
            <p>The best multiplayer drawing and guessing game!</p>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
                <Link to="/login"><button style={{ padding: '10px 20px' }}>Login</button></Link>
                <Link to="/register"><button style={{ padding: '10px 20px' }}>Register</button></Link>
                <Link to="/lobby"><button style={{ padding: '10px 20px' }}>Enter Lobby</button></Link>
            </div>
        </div>
    );
}
