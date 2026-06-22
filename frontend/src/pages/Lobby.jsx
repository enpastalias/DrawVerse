import React, { useState, useContext, useEffect } from 'react';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import PlayerCard from '../components/PlayerCard';
import StatusBadge from '../components/StatusBadge';

export default function Lobby() {
    const { socket } = useContext(SocketContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [localUsername, setLocalUsername] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [room, setRoom] = useState(null);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [rounds, setRounds] = useState(3);
    const [drawTime, setDrawTime] = useState(80);

    const displayUsername = user ? user.username : localUsername;

    useEffect(() => {
        if (!socket) return;

        const handleRoomUpdate = (roomState) => setRoom(roomState);
        const handleRoomError = (err) => setError(err.message);
        
        socket.on('room:update', handleRoomUpdate);
        socket.on('room:error', handleRoomError);
        socket.on('game:started', ({ roomCode } = {}) => {
            if (roomCode) {
                navigate(`/game/${roomCode}`);
            }
        });

        // Request current room status if we are supposedly in one
        // (In case of context re-renders but socket is already in room)
        if (socket.roomCode) {
            socket.emit('room:get', { roomCode: socket.roomCode });
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
        setCopied(false);
    };

    const copyToClipboard = () => {
        if (!room) return;
        navigator.clipboard.writeText(room.roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ACTIVE ROOM SCREEN
    if (room) {
        const isHost = room.host === socket?.id;
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                padding: '1rem 0',
                animation: 'fadeIn 0.5s ease-out forwards'
            }}>
                {/* Active Room Title Banner */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                            <h2 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
                                Room: <span style={{ color: 'var(--color-primary-hover)' }}>{room.roomCode}</span>
                            </h2>
                            <StatusBadge type={room.status === 'waiting' ? 'success' : 'cyan'}>
                                {room.status}
                            </StatusBadge>
                        </div>
                        <p style={{ color: 'var(--text-muted)' }}>
                            Share the room code below to invite other players
                        </p>
                    </div>

                    <Button variant="danger" onClick={handleLeaveRoom} style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>
                        Leave Room
                    </Button>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '2rem',
                    alignItems: 'start'
                }} className="lobby-grid-responsive">
                    {/* Left Column: Room Details & Controls */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <Card style={{ padding: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.25rem' }}>
                                Invitation Link
                            </h3>
                            
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: 'rgba(0, 0, 0, 0.3)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '0.5rem 0.5rem 0.5rem 1.25rem',
                                justifyContent: 'space-between',
                                gap: '1rem'
                            }}>
                                <span style={{ 
                                    fontFamily: 'monospace', 
                                    fontSize: '1.5rem', 
                                    fontWeight: '800', 
                                    letterSpacing: '0.15em',
                                    color: '#fff' 
                                }}>
                                    {room.roomCode}
                                </span>
                                
                                <Button 
                                    variant={copied ? 'secondary' : 'primary'} 
                                    onClick={copyToClipboard}
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', textTransform: 'none' }}
                                >
                                    {copied ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            Copied!
                                        </span>
                                    ) : (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                            </svg>
                                            Copy Code
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </Card>

                        <Card style={{ padding: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>
                                Host Panel
                            </h3>
                            
                            {isHost ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', margin: 0 }}>
                                        You are the host of this room. When everyone has joined, set the game parameters and click the button below to launch the match.
                                    </p>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Rounds
                                            </label>
                                            <input 
                                                type="number" 
                                                min="1" 
                                                max="10" 
                                                value={rounds} 
                                                onChange={e => setRounds(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                                                style={{
                                                    background: 'rgba(255, 255, 255, 0.03)',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    color: '#fff',
                                                    padding: '0.6rem 0.75rem',
                                                    fontSize: '0.95rem',
                                                    fontWeight: '600',
                                                    outline: 'none',
                                                    transition: 'border-color 0.2s'
                                                }}
                                            />
                                        </div>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Time (sec)
                                            </label>
                                            <input 
                                                type="number" 
                                                min="10" 
                                                max="180" 
                                                value={drawTime} 
                                                onChange={e => setDrawTime(Math.max(10, Math.min(180, parseInt(e.target.value) || 10)))}
                                                style={{
                                                    background: 'rgba(255, 255, 255, 0.03)',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    color: '#fff',
                                                    padding: '0.6rem 0.75rem',
                                                    fontSize: '0.95rem',
                                                    fontWeight: '600',
                                                    outline: 'none',
                                                    transition: 'border-color 0.2s'
                                                }}
                                            />
                                        </div>
                                    </div>
                                    
                                    <Button 
                                        variant="primary" 
                                        onClick={() => socket.emit('room:start', { rounds, drawTime })} 
                                        style={{ width: '100%', padding: '0.9rem', fontSize: '1.05rem', marginTop: '4px' }}
                                        className="pulse-glow"
                                    >
                                        Start Game
                                    </Button>
                                </div>
                            ) : (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '1.5rem 1rem',
                                    border: '1.5px dashed var(--border-color)',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'rgba(255, 255, 255, 0.01)'
                                }}>
                                    <div className="pulse-glow-cyan" style={{
                                        display: 'inline-flex',
                                        width: '8px',
                                        height: '8px',
                                        background: 'var(--color-secondary)',
                                        borderRadius: '50%',
                                        marginRight: '8px',
                                        verticalAlign: 'middle'
                                    }} />
                                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.95rem' }}>
                                        Waiting for host to start...
                                    </span>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Right Column: Player Roster */}
                    <Card style={{ padding: '2rem', minHeight: '350px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                                Players Roster
                            </h3>
                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.05)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                                {room.players.length} / {room.maxPlayers}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {room.players.map(p => (
                                <PlayerCard 
                                    key={p.socketId} 
                                    player={p} 
                                    isLocalPlayer={p.socketId === socket?.id}
                                    isDrawer={room.currentDrawer === p.socketId}
                                />
                            ))}

                            {room.players.length === 1 && (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '2.5rem 1.5rem',
                                    color: 'var(--text-muted)',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.5',
                                    background: 'rgba(255, 255, 255, 0.01)',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px dashed var(--border-color)',
                                    marginTop: '1rem'
                                }}>
                                    <p style={{ fontWeight: '600', color: '#fff', marginBottom: '0.25rem' }}>👋 Solo Lobby</p>
                                    Share the room code above with friends to begin playing together!
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                <style>{`
                    @media(min-width: 768px) {
                        .lobby-grid-responsive {
                            grid-template-columns: 1fr 1.2fr;
                        }
                    }
                `}</style>
            </div>
        );
    }

    // PRE-ROOM (CREATE OR JOIN) SCREEN
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            padding: '1rem 0',
            animation: 'fadeIn 0.5s ease-out forwards'
        }}>
            <div>
                <h2 style={{ fontSize: '2.25rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                    Game Lobby
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>
                    Create a new drawing room or enter a code to join an existing match
                </p>
            </div>

            {error && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1.5px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem 1rem',
                    color: '#f87171',
                    fontSize: '0.875rem',
                    fontWeight: '600',
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

            {!user && (
                <Card style={{ padding: '1.5rem 2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '350px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                            Guest Display Name
                        </label>
                        <input
                            type="text"
                            placeholder="Enter display name"
                            value={localUsername}
                            onChange={(e) => setLocalUsername(e.target.value)}
                        />
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            Or <a href="/login" style={{ color: 'var(--color-primary-hover)', textDecoration: 'none', fontWeight: '700' }}>Login</a> to use your account profile.
                        </p>
                    </div>
                </Card>
            )}

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '2rem'
            }} className="lobby-actions-responsive">
                
                {/* Create Room Box */}
                <Card style={{ padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                background: 'rgba(139, 92, 246, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--color-primary-hover)'
                            }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                            </div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: '700' }}>Create Room</h3>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2rem' }}>
                            Host a new match. You will receive a unique room code to invite other participants. As host, you control the game starts.
                        </p>
                    </div>

                    <Button variant="primary" onClick={handleCreateRoom} style={{ padding: '0.85rem' }}>
                        Generate New Room
                    </Button>
                </Card>

                {/* Join Room Box */}
                <Card style={{ padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                background: 'rgba(6, 182, 212, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--color-secondary)'
                            }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
                                </svg>
                            </div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: '700' }}>Join Room</h3>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                            Already have an invite? Enter the 6-character room code below to instantly connect to your friend's room.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <input
                                type="text"
                                placeholder="Enter Room Code"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                style={{
                                    fontFamily: 'monospace',
                                    fontSize: '1.1rem',
                                    letterSpacing: '0.1em',
                                    fontWeight: '700'
                                }}
                            />
                            <Button variant="secondary" onClick={handleJoinRoom} style={{ padding: '0 1.5rem' }}>
                                Join
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            <style>{`
                @media(min-width: 768px) {
                    .lobby-actions-responsive {
                        grid-template-columns: 1fr 1fr;
                    }
                }
            `}</style>
        </div>
    );
}
