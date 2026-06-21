import React, { useState, useContext, useEffect } from 'react';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Lobby() {
    const { socket } = useContext(SocketContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // If user is logged in, use their username, else allow local input
    const [localUsername, setLocalUsername] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [room, setRoom] = useState(null);
    const [error, setError] = useState(null);

    const displayUsername = user ? user.username : localUsername;

    useEffect(() => {
        if (!socket) return;

        const handleRoomUpdate = (roomState) => setRoom(roomState);
        const handleRoomError = (err) => setError(err.message);

        socket.on('room:update', handleRoomUpdate);
        socket.on('room:error', handleRoomError);
        socket.on('game:started', () => {
            if (room?.roomCode) {
                navigate(`/game/${room.roomCode}`);
            }
        });

        return () => {
            socket.off('room:update', handleRoomUpdate);
            socket.off('room:error', handleRoomError);
            socket.off('game:started');
        };
    }, [socket, navigate, room]);

    const handleCreateRoom = () => {
        if (!displayUsername) return setError('Please enter a username or Login first');
        setError(null);
        socket.emit('room:create', { username: displayUsername, userId: user?._id || 'guest' });
    };

    const handleJoinRoom = () => {
        if (!displayUsername) return setError('Please enter a username or Login first');
        if (!joinCode) return setError('Please enter a room code');
        setError(null);
        socket.emit('room:join', { roomCode: joinCode, username: displayUsername, userId: user?._id || 'guest' });
    };

    const handleLeaveRoom = () => {
        socket.emit('room:leave');
        setRoom(null);
    };

    if (room) {
        return (
            <div style={{ padding: 20 }}>
                <h2>Active Room: {room.roomCode}</h2>
                <p>Status: {room.status}</p>
                <button onClick={handleLeaveRoom}>Leave Room</button>

                <hr />
                <h3>Players ({room.players.length}/{room.maxPlayers})</h3>
                <ul>
                    {room.players.map(p => (
                        <li key={p.socketId}>
                            {p.username} {p.isHost && '(Host)'} {p.socketId === socket.id && '(You)'}
                        </li>
                    ))}
                </ul>

                <hr />
                <h3>Host Controls</h3>
                {room.host === socket?.id ? (
                    <div>
                        <p>You are the Host.</p>
                        <button onClick={() => socket.emit('room:start')}>Start Game</button>
                    </div>
                ) : (
                    <p>Waiting for host to start...</p>
                )}
            </div>
        );
    }

    return (
        <div style={{ padding: 20 }}>
            <h2>DrawVerse Lobby</h2>
            {error && <p style={{ color: 'red', border: '1px solid red', padding: 10 }}>{error}</p>}

            {!user && (
                <div style={{ marginBottom: 20 }}>
                    <input
                        type="text"
                        placeholder="Guest Display Name"
                        value={localUsername}
                        onChange={(e) => setLocalUsername(e.target.value)}
                    />
                    <p style={{ fontSize: '12px', color: '#666' }}>Or log in to use your account profile.</p>
                </div>
            )}

            <div style={{ padding: 20, border: '1px solid #ccc', marginBottom: 20 }}>
                <h3>Create a Room</h3>
                <button onClick={handleCreateRoom}>Generate New Room</button>
            </div>

            <div style={{ padding: 20, border: '1px solid #ccc' }}>
                <h3>Join a Room</h3>
                <input
                    type="text"
                    placeholder="Enter Room Code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                />
                <button onClick={handleJoinRoom} style={{ marginLeft: 10 }}>Join</button>
            </div>
        </div>
    );
}
