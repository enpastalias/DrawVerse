import React, { useRef, useEffect, useState, useContext } from 'react';
import { SocketContext } from '../../context/SocketContext';

export default function Canvas({ roomCode }) {
    const canvasRef = useRef(null);
    const { socket } = useContext(SocketContext);

    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(5);
    const [room, setRoom] = useState(null);
    const [selectedWord, setSelectedWord] = useState('');
    const [wordMessage, setWordMessage] = useState('');

    const prevPos = useRef({ x: 0, y: 0 });

    const isDrawer = room?.currentDrawer === socket?.id;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Auto-resize logic (simple MVP approach)
        const handleResize = () => {
            const parent = canvas.parentElement;
            if (!parent) return;

            // Save canvas state
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight || 500;

            // Restore canvas state
            ctx.putImageData(imgData, 0, 0);
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial resize

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
                lines.forEach(drawLine);
            });

            socket.on('draw:line', (line) => {
                drawLine(line);
            });

            socket.on('draw:clear', () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
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
            }
        };
    }, [socket, roomCode]);

    const startDrawing = (e) => {
        if (!isDrawer || room?.gameStatus !== 'drawing') return;
        setIsDrawing(true);
        const pos = getMousePos(e);
        prevPos.current = pos;
    };

    const draw = (e) => {
        if (!isDrawing || !isDrawer || room?.gameStatus !== 'drawing') return;

        // Throttle via rAF or simple checks can be added here
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

    const getMousePos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        // Handle both mouse and touch events
        let clientX = e.clientX;
        let clientY = e.clientY;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px', background: '#ccc' }}>
                {room?.gameStatus === 'word_selection' ? (
                    <span style={{ fontWeight: 'bold', color: '#333' }}>
                        {isDrawer ? 'Choose a word to start drawing' : 'Drawer is choosing a word...'}
                    </span>
                ) : room?.gameStatus === 'drawing' ? (
                    isDrawer ? (
                        <>
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                title="Color"
                            />
                            <input
                                type="range"
                                min="1" max="50"
                                value={brushSize}
                                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                title="Brush Size"
                            />
                            <button onClick={handleClear}>Clear Canvas</button>
                            <span style={{ marginLeft: 'auto', fontWeight: 'bold', color: 'green' }}>
                                You are drawing: <span style={{ textDecoration: 'underline', color: '#0056b3' }}>{selectedWord || room?.currentWord || '...'}</span>
                            </span>
                        </>
                    ) : (
                        <>
                            <span style={{ fontWeight: 'bold', color: '#333' }}>
                                Game started! Guess the drawing
                            </span>
                            <span style={{ marginLeft: 'auto', fontStyle: 'italic', color: '#555' }}>
                                {wordMessage || 'Drawer selected a word'}
                            </span>
                        </>
                    )
                ) : (
                    <span style={{ fontWeight: 'bold', color: '#555' }}>
                        Waiting for game to start...
                    </span>
                )}
            </div>
            <div style={{ flex: 1, border: '1px solid black', overflow: 'hidden', position: 'relative' }}>
                {room?.gameStatus === 'word_selection' && (
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 10
                    }}>
                        {isDrawer ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '30px',
                                background: '#fff',
                                borderRadius: '12px',
                                boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                                border: '1px solid #ddd'
                            }}>
                                <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#333' }}>Choose your word</h3>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    {room?.wordOptions?.map((word) => (
                                        <button
                                            key={word}
                                            onClick={() => handleSelectWord(word)}
                                            style={{
                                                padding: '12px 24px',
                                                fontSize: '16px',
                                                cursor: 'pointer',
                                                backgroundColor: '#28a745',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontWeight: 'bold',
                                                transition: 'background-color 0.2s',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                            onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
                                            onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
                                        >
                                            {word}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ color: '#555' }}>Drawer is choosing a word...</h3>
                            </div>
                        )}
                    </div>
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
                    style={{ display: 'block', touchAction: 'none' }}
                />
            </div>
        </div>
    );
}
