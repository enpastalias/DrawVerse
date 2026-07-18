import React, { useState, useContext, useEffect } from 'react';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Lobby() {
    const { socket } = useContext(SocketContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const [localUsername, setLocalUsername] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [room, setRoom] = useState(null);
    const [error, setError] = useState(null);
    const [rounds, setRounds] = useState(3);
    const [drawTime, setDrawTime] = useState(80);

    const displayUsername = user ? user.username : localUsername;

    useEffect(() => {
        if (!socket) return;

        const handleRoomUpdate = (roomState) => {
            if (!roomState) return setRoom(null);
            const inRoom = roomState.players.some(p => p.socketId === socket.id);
            if (inRoom) setRoom(roomState);
            else setRoom(null);
        };
        const handleRoomError = (err) => setError(err.message);

        socket.on('room:update', handleRoomUpdate);
        socket.on('room:error', handleRoomError);
        socket.on('game:started', ({ roomCode } = {}) => {
            if (roomCode) {
                navigate(`/game/${roomCode}`);
            }
        });

        const activeCode = location.state?.returningRoomCode || socket.roomCode;
        if (activeCode && !location.state?.exited) {
            socket.emit('room:get', { roomCode: activeCode });
        }

        return () => {
            socket.off('room:update', handleRoomUpdate);
            socket.off('room:error', handleRoomError);
            socket.off('game:started');
        };
    }, [socket, navigate]);

    const handleCreateRoom = () => {
        if (!displayUsername) return setError('Please enter a username or login first');
        setError(null);
        socket.emit('room:create', { username: displayUsername, userId: user?._id || 'guest' });
    };

    const handleJoinRoom = () => {
        if (!displayUsername) return setError('Please enter a username or login first');
        if (!joinCode) return setError('Please enter a room code');
        setError(null);
        socket.emit('room:join', { roomCode: joinCode.trim(), username: displayUsername, userId: user?._id || 'guest' });
    };

    const handleLeaveRoom = () => {
        socket.emit('room:leave');
        setRoom(null);
    };

    // ACTIVE ROOM SCREEN
    if (room) {
        const isHost = room.host === socket?.id;
        return (
            <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>Room: {room.roomCode} - Status: {room.status}</h2>
                    <button onClick={handleLeaveRoom} style={{ backgroundColor: '#dc3545' }}>Leave Room</button>
                </div>

                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div className="card" style={{ flex: 1, minWidth: '300px' }}>
                        <h3>Share Room Code</h3>
                        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{room.roomCode}</p>

                        {isHost ? (
                            <div style={{ marginTop: '20px' }}>
                                <h3>Host Settings</h3>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                    <div>
                                        <label>Rounds: </label>
                                        <input
                                            type="number"
                                            value={rounds}
                                            onChange={e => setRounds(e.target.value)}
                                            min="1" max="10"
                                            style={{ width: '60px' }}
                                        />
                                    </div>
                                    <div>
                                        <label>Time (sec): </label>
                                        <input
                                            type="number"
                                            value={drawTime}
                                            onChange={e => setDrawTime(e.target.value)}
                                            min="10" max="180"
                                            style={{ width: '60px' }}
                                        />
                                    </div>
                                </div>
                                <button onClick={() => socket.emit('room:start', { rounds, drawTime })}>Start Game</button>
                            </div>
                        ) : (
                            <div style={{ marginTop: '20px' }}>
                                <p>Waiting for host to start...</p>
                            </div>
                        )}
                    </div>

                    <div className="card" style={{ flex: 1, minWidth: '300px' }}>
                        <h3>Players ({room.players.length}/{room.maxPlayers})</h3>
                        <ul style={{ listStyleType: 'none', padding: 0 }}>
                            {room.players.map(p => (
                                <li key={p.socketId} style={{ padding: '10px 0', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{p.username} {p.socketId === socket.id ? '(You)' : ''}</span>
                                    <span>{p.isHost ? 'Host' : 'Player'}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    // PRE-ROOM (CREATE OR JOIN) SCREEN
    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ textAlign: 'center' }}>Game Lobby</h2>

            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

            {!user && (
                <div className="card" style={{ maxWidth: '400px', margin: '0 auto 20px' }}>
                    <label>Guest Username</label>
                    <input
                        type="text"
                        value={localUsername}
                        onChange={e => setLocalUsername(e.target.value)}
                        placeholder="Enter username"
                        style={{ width: '100%', marginBottom: '10px' }}
                    />
                    <small>Or <a href="/login">Login</a> for persistent stats.</small>
                </div>
            )}

            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <div className="card" style={{ width: '300px' }}>
                    <h3>Create New Room</h3>
                    <p>Host a match with your custom rules.</p>
                    <button onClick={handleCreateRoom} style={{ width: '100%', marginTop: '10px' }}>Create Room</button>
                </div>

                <div className="card" style={{ width: '300px' }}>
                    <h3>Join Room</h3>
                    <p>Enter 6-digit code to play.</p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <input
                            type="text"
                            value={joinCode}
                            onChange={e => setJoinCode(e.target.value.toUpperCase())}
                            placeholder="CODE"
                            style={{ flex: 1, minWidth: 0 }}
                        />
                        <button onClick={handleJoinRoom} style={{ backgroundColor: '#28a745' }}>Join</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
