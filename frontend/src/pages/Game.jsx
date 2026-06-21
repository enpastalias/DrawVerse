import React, { useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';
import Canvas from '../components/game/Canvas';
import Card from '../components/Card';

export default function Game() {
    const { roomCode } = useParams();
    const { socket } = useContext(SocketContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!socket) return;

        // Listen for room closing or being kicked out
        const handleRoomError = (err) => {
            alert(err.message);
            navigate('/lobby');
        };

        socket.on('room:error', handleRoomError);

        return () => {
            socket.off('room:error', handleRoomError);
        };
    }, [socket, navigate]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            padding: '1rem 0 2rem 0',
            height: 'calc(100vh - 120px)',
            minHeight: '600px',
            animation: 'fadeIn 0.5s ease-out forwards'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 1rem',
                borderBottom: '1px solid var(--border-color)'
            }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        DrawVerse Arena
                        <span style={{ 
                            fontSize: '0.9rem', 
                            color: 'var(--color-secondary)', 
                            background: 'rgba(6, 182, 212, 0.12)', 
                            padding: '0.2rem 0.6rem', 
                            borderRadius: '4px',
                            fontWeight: '700',
                            fontFamily: 'monospace'
                        }}>
                            #{roomCode}
                        </span>
                    </h2>
                </div>
            </div>

            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                <Canvas roomCode={roomCode} />
            </div>
        </div>
    );
}
