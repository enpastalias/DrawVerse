import React, { useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';
import Canvas from '../components/game/Canvas';

export default function Game() {
    const { roomCode } = useParams();
    const { socket } = useContext(SocketContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!socket) return;
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
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)', gap: '15px' }}>
            <div className="card" style={{ padding: '10px 20px', margin: 0 }}>
                <h2>Arena #{roomCode}</h2>
            </div>

            <div style={{ flex: 1 }}>
                <Canvas roomCode={roomCode} />
            </div>
        </div>
    );
}
