import React, { useRef, useEffect, useState, useContext } from 'react';
import { SocketContext } from '../../context/SocketContext';
import Button from '../Button';
import Card from '../Card';
import StatusBadge from '../StatusBadge';
import Modal from '../Modal';

export default function Canvas({ roomCode }) {
    const canvasRef = useRef(null);
    const messagesEndRef = useRef(null);
    const { socket } = useContext(SocketContext);

    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(5);
    const [room, setRoom] = useState(null);
    const [selectedWord, setSelectedWord] = useState('');
    const [wordMessage, setWordMessage] = useState('');

    // Guessing/Chat States
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');

    const prevPos = useRef({ x: 0, y: 0 });

    const isDrawer = room?.currentDrawer === socket?.id;
    const localPlayer = room?.players?.find(p => p.socketId === socket?.id);
    const hasGuessedCorrectly = localPlayer?.hasGuessed || false;

    // Preserved predefined colors palette
    const colorsPalette = [
        '#000000', // Black
        '#ffffff', // White
        '#ef4444', // Red
        '#f97316', // Orange
        '#eab308', // Yellow
        '#22c55e', // Green
        '#3b82f6', // Blue
        '#a855f7', // Purple
        '#ec4899', // Pink
    ];

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Auto-resize logic (improved responsive canvas scaling)
        const handleResize = () => {
            const parent = canvas.parentElement;
            if (!parent) return;

            // Save canvas content
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(canvas, 0, 0);

            // Resize
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight || 450;

            // Redraw background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Restore canvas state
            ctx.drawImage(tempCanvas, 0, 0);
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial resize

        // Initial background fill to white
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Socket Handlers
        const drawLine = ({ x0, y0, x1, y1, color, size }) => {
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.strokeStyle = color;
            ctx.lineWidth = size;
            ctx.lineCap = 'round';
            ctx.stroke();
        };

        if (socket) {
            socket.emit('room:get', { roomCode });
            socket.emit('draw:request_history', { roomCode });

            socket.on('room:update', (roomState) => {
                setRoom(roomState);
            });

            socket.on('word:selected', (data) => {
                if (data.word) {
                    setSelectedWord(data.word);
                } else if (data.message) {
                    setWordMessage(data.message);
                }
            });

            socket.on('draw:history', (lines) => {
                // Clear to white first
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                lines.forEach(drawLine);
            });

            socket.on('draw:line', (line) => {
                drawLine(line);
            });

            socket.on('draw:clear', () => {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            });

            // New Guess Handlers
            socket.on('guess:message', (data) => {
                setMessages((prev) => [...prev, { ...data, type: 'guess', id: Date.now() + Math.random() }]);
            });

            socket.on('guessed:correct', (data) => {
                setMessages((prev) => [...prev, { ...data, type: 'correct', id: Date.now() + Math.random() }]);
            });
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            if (socket) {
                socket.off('room:update');
                socket.off('word:selected');
                socket.off('draw:history');
                socket.off('draw:line');
                socket.off('draw:clear');
                socket.off('guess:message');
                socket.off('guessed:correct');
            }
        };
    }, [socket, roomCode]);

    // Reset round-specific parameters when switching back to word selection
    useEffect(() => {
        if (room?.gameStatus === 'word_selection') {
            setMessages([]);
            setSelectedWord('');
            setWordMessage('');
        }
    }, [room?.gameStatus]);

    // Auto-scroll messages to the bottom
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const startDrawing = (e) => {
        if (!isDrawer || room?.gameStatus !== 'drawing') return;
        setIsDrawing(true);
        const pos = getMousePos(e);
        prevPos.current = pos;
    };

    const draw = (e) => {
        if (!isDrawing || !isDrawer || room?.gameStatus !== 'drawing') return;

        const currentPos = getMousePos(e);

        const lineData = {
            x0: prevPos.current.x,
            y0: prevPos.current.y,
            x1: currentPos.x,
            y1: currentPos.y,
            color,
            size: brushSize
        };

        // Draw locally
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(lineData.x0, lineData.y0);
        ctx.lineTo(lineData.x1, lineData.y1);
        ctx.strokeStyle = lineData.color;
        ctx.lineWidth = lineData.size;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Emit to server
        if (socket) {
            socket.emit('draw:line', { roomCode, line: lineData });
        }

        prevPos.current = currentPos;
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const handleClear = () => {
        if (socket && isDrawer && room?.gameStatus === 'drawing') {
            socket.emit('draw:clear', { roomCode });
        }
    };

    const handleSelectWord = (word) => {
        if (socket) {
            socket.emit('word:select', { roomCode, word }, (res) => {
                if (res && res.success) {
                    setSelectedWord(word);
                } else {
                    alert(res?.message || 'Failed to select word');
                }
            });
        }
    };

    const handleSendGuess = (e) => {
        e.preventDefault();
        if (!inputText.trim() || !socket) return;
        socket.emit('guess:send', { roomCode, guess: inputText });
        setInputText('');
    };

    const getMousePos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        let clientX = e.clientX;
        let clientY = e.clientY;

        // Support touch events
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', gap: '1rem' }}>
            
            {/* Status Header Bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.25rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                minHeight: '62px'
            }}>
                {room?.gameStatus === 'word_selection' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="pulse-glow-cyan" style={{ display: 'inline-flex', width: '8px', height: '8px', background: 'var(--color-secondary)', borderRadius: '50%' }} />
                        <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>
                            {isDrawer ? 'Choose a word to start drawing' : 'Drawer is choosing a word...'}
                        </span>
                    </div>
                ) : room?.gameStatus === 'drawing' ? (
                    isDrawer ? (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="pulse-glow" style={{ display: 'inline-flex', width: '8px', height: '8px', background: 'var(--color-primary)', borderRadius: '50%' }} />
                                <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--color-primary-hover)' }}>
                                    YOU ARE THE DRAWER
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>You are drawing:</span>
                                <StatusBadge type="success" style={{ fontSize: '0.9rem', padding: '0.3rem 0.85rem' }}>
                                    {selectedWord || room?.currentWord || '...'}
                                </StatusBadge>
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="pulse-glow-cyan" style={{ display: 'inline-flex', width: '8px', height: '8px', background: 'var(--color-secondary)', borderRadius: '50%' }} />
                                <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>
                                    Guess the drawing
                                </span>
                            </div>
                            <StatusBadge type="cyan" style={{ fontSize: '0.85rem' }}>
                                {wordMessage || 'Drawer selected a word'}
                            </StatusBadge>
                        </>
                    )
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-flex', width: '8px', height: '8px', background: 'var(--text-muted)', borderRadius: '50%' }} />
                        <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                            Waiting for game to start...
                        </span>
                    </div>
                )}
            </div>

            {/* Main Interactive Board Display */}
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '1.25rem',
                flex: 1,
                minHeight: 0
            }} className="game-workspace-split">
                
                {/* Left Side: Canvas easel */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 3,
                    gap: '1rem',
                    minWidth: 0
                }}>
                    <div style={{
                        flex: 1,
                        border: '1.5px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        position: 'relative',
                        background: '#ffffff',
                        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
                        minHeight: '350px'
                    }}>
                        
                        {/* WORD SELECTION MODALS */}
                        {room?.gameStatus === 'word_selection' && (
                            isDrawer ? (
                                <Modal isOpen={true} title="Choose your word">
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                        Select one of the secret words below. Once selected, your canvas will unlock and drawing will begin!
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {room?.wordOptions?.map((word) => (
                                            <Button
                                                key={word}
                                                onClick={() => handleSelectWord(word)}
                                                variant="primary"
                                                style={{ width: '100%', padding: '0.85rem' }}
                                            >
                                                {word}
                                            </Button>
                                        ))}
                                    </div>
                                </Modal>
                            ) : (
                                <Modal isOpen={true} title="Drawer is choosing a word">
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '50%',
                                            border: '3px solid var(--color-secondary)',
                                            borderTopColor: 'transparent',
                                            animation: 'spin 1s linear infinite'
                                        }} />
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '500' }}>
                                            Please wait while the drawer selects a secret word to paint...
                                        </p>
                                    </div>
                                </Modal>
                            )
                        )}

                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseOut={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                            style={{
                                display: 'block',
                                touchAction: 'none',
                                cursor: isDrawer && room?.gameStatus === 'drawing' ? 'crosshair' : 'default',
                                width: '100%',
                                height: '100%',
                                background: '#ffffff'
                            }}
                        />
                    </div>

                    {/* Toolbar controls (only shown to active drawer) */}
                    {isDrawer && room?.gameStatus === 'drawing' && (
                        <Card style={{
                            padding: '1.25rem 1.5rem',
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '1.5rem',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {colorsPalette.map(c => {
                                        const isSelected = color.toLowerCase() === c.toLowerCase();
                                        return (
                                            <button
                                                key={c}
                                                onClick={() => setColor(c)}
                                                style={{
                                                    width: '28px',
                                                    height: '28px',
                                                    borderRadius: '50%',
                                                    background: c,
                                                    border: isSelected 
                                                        ? '2px solid #fff' 
                                                        : c.toLowerCase() === '#ffffff' 
                                                            ? '1.5px solid rgba(0,0,0,0.15)' 
                                                            : '1.5px solid transparent',
                                                    cursor: 'pointer',
                                                    transition: 'transform 0.15s ease',
                                                    transform: isSelected ? 'scale(1.2)' : 'none',
                                                    boxShadow: isSelected 
                                                        ? '0 0 10px rgba(255,255,255,0.4), 0 2px 6px rgba(0,0,0,0.3)' 
                                                        : '0 1px 4px rgba(0,0,0,0.25)'
                                                }}
                                                title={c}
                                            />
                                        );
                                    })}
                                </div>
                                <div style={{
                                    position: 'relative',
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    border: '1.5px solid rgba(255,255,255,0.1)',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                                    background: 'linear-gradient(45deg, red, orange, yellow, green, blue, violet)'
                                }} title="Custom Color">
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        style={{
                                            position: 'absolute',
                                            top: '-4px',
                                            left: '-4px',
                                            width: '36px',
                                            height: '36px',
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            opacity: 0
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1', maxWidth: '300px', minWidth: '180px' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                                    Size
                                </span>
                                <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    value={brushSize}
                                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                    style={{
                                        flex: 1,
                                        height: '5px',
                                        borderRadius: '5px',
                                        background: 'rgba(255,255,255,0.1)',
                                        outline: 'none',
                                        WebkitAppearance: 'none',
                                        cursor: 'pointer'
                                    }}
                                    title="Brush Size"
                                />
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <div style={{
                                        width: `${Math.min(26, Math.max(2, brushSize))}px`,
                                        height: `${Math.min(26, Math.max(2, brushSize))}px`,
                                        borderRadius: '50%',
                                        background: color,
                                        transition: 'width 0.1s ease, height 0.1s ease, background-color 0.2s ease',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                    }} />
                                </div>
                            </div>

                            <div>
                                <Button 
                                    variant="danger" 
                                    onClick={handleClear}
                                    style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '4px', verticalAlign: 'middle', marginTop: '-2px' }}>
                                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                    Clear Canvas
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right Side: Chat / Guessing Panel */}
                <Card style={{
                    width: '300px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '380px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)'
                }} className="guess-sidebar">
                    
                    <div style={{
                        borderBottom: '1px solid var(--border-color)',
                        paddingBottom: '0.75rem',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexShrink: 0
                    }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-hover)" strokeWidth="2.5">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            Guesses & Chat
                        </h3>
                    </div>

                    {/* Scrollable messages box */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.6rem',
                        paddingRight: '4px',
                        marginBottom: '1rem'
                    }}>
                        {messages.map((m) => {
                            if (m.type === 'correct') {
                                return (
                                    <div key={m.id || Math.random()} style={{
                                        background: 'rgba(16, 185, 129, 0.12)',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        borderRadius: 'var(--radius-sm)',
                                        padding: '0.6rem 0.85rem',
                                        color: '#34d399',
                                        fontSize: '0.9rem',
                                        fontWeight: '700',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        animation: 'slideUp 0.3s ease-out forwards',
                                        boxShadow: 'var(--glow-shadow-success)'
                                    }}>
                                        <span>🏆</span>
                                        <span>{m.message}</span>
                                    </div>
                                );
                            }
                            return (
                                <div key={m.id || Math.random()} style={{
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '0.6rem 0.85rem',
                                    fontSize: '0.9rem',
                                    animation: 'slideUp 0.3s ease-out forwards',
                                    wordBreak: 'break-word',
                                    lineHeight: '1.4'
                                }}>
                                    <strong style={{ color: 'var(--color-primary-hover)', marginRight: '6px' }}>
                                        {m.username}:
                                    </strong>
                                    <span style={{ color: 'var(--text-main)' }}>{m.guess}</span>
                                </div>
                            );
                        })}

                        {messages.length === 0 && (
                            <div style={{
                                margin: 'auto',
                                textAlign: 'center',
                                color: 'var(--text-muted)',
                                fontSize: '0.85rem',
                                padding: '1rem'
                            }}>
                                No guesses submitted yet.
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Guess Send Form */}
                    <form onSubmit={handleSendGuess} style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={
                                isDrawer 
                                    ? "You are drawing..." 
                                    : hasGuessedCorrectly 
                                        ? "You guessed correctly!" 
                                        : room?.gameStatus !== 'drawing' 
                                            ? "Waiting for game..." 
                                            : "Type your guess here..."
                            }
                            disabled={isDrawer || hasGuessedCorrectly || room?.gameStatus !== 'drawing'}
                            style={{
                                padding: '0.65rem 0.85rem',
                                fontSize: '0.9rem'
                            }}
                        />
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isDrawer || hasGuessedCorrectly || room?.gameStatus !== 'drawing' || !inputText.trim()}
                            style={{
                                padding: '0.65rem 1rem',
                                fontSize: '0.85rem',
                                flexShrink: 0
                            }}
                        >
                            Send
                        </Button>
                    </form>
                </Card>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .game-workspace-split {
                        flex-direction: column !important;
                        height: auto !important;
                    }
                    .guess-sidebar {
                        width: 100% !important;
                        min-height: 250px !important;
                    }
                }
            `}</style>
        </div>
    );
}
