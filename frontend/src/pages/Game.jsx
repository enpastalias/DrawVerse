import React, { useEffect, useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';
import Canvas from '../components/game/Canvas';

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
        <div style={{ display: 'flex', flexDirection: 'column', height: '80vh', border: '1px solid black' }}>
            <div style={{ background: '#333', color: '#fff', padding: '10px' }}>
                <h3>DrawVerse - Room {roomCode}</h3>
            </div>
            <div style={{ flex: 1 }}>
                <Canvas roomCode={roomCode} />
            </div>
        </div>
    );
}
