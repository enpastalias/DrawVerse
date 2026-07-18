import React, { useRef, useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { SocketContext } from '../../context/SocketContext';

export default function Canvas({ roomCode }) {
    const canvasRef = useRef(null);
    const messagesEndRef = useRef(null);
    const { socket } = useContext(SocketContext);
    const navigate = useNavigate();

    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(5);
    const [room, setRoom] = useState(null);
    const [selectedWord, setSelectedWord] = useState('');
    const [wordMessage, setWordMessage] = useState('');
    const [timer, setTimer] = useState(0);
    const [roundEndData, setRoundEndData] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');

    const prevPos = useRef({ x: 0, y: 0 });

    const isDrawer = room?.currentDrawer === socket?.id;
    const localPlayer = room?.players?.find(p => p.socketId === socket?.id);

    const colorsPalette = ['#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const handleResize = () => {
            const parent = canvas.parentElement;
            if (!parent) return;
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(canvas, 0, 0);

            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight || 450;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(tempCanvas, 0, 0);
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

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

            socket.on('room:update', setRoom);
            socket.on('word:selected', (data) => {
                if (data.word) setSelectedWord(data.word);
                else if (data.message) setWordMessage(data.message);
            });
            socket.on('draw:history', (lines) => {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                lines.forEach(drawLine);
            });
            socket.on('draw:line', drawLine);
            socket.on('draw:clear', () => {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            });
            socket.on('guess:message', (data) => setMessages(prev => [...prev, { ...data, type: 'guess', id: Date.now() + Math.random() }]));
            socket.on('guessed:correct', (data) => setMessages(prev => [...prev, { ...data, type: 'correct', id: Date.now() + Math.random() }]));
            socket.on('timer:update', ({ time }) => setTimer(time));
            socket.on('round:end', setRoundEndData);
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
                socket.off('timer:update');
                socket.off('round:end');
            }
        };
    }, [socket, roomCode]);

    useEffect(() => {
        if (room?.gameStatus === 'word_selection') {
            setMessages([]);
            setSelectedWord('');
            setWordMessage('');
            setRoundEndData(null);
            setTimer(0);
        }
    }, [room?.gameStatus]);

    useEffect(() => {
        if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const getMousePos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        let clientX = e.clientX, clientY = e.clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX; clientY = e.touches[0].clientY;
        }
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDrawing = (e) => {
        if (!isDrawer || room?.gameStatus !== 'drawing') return;
        setIsDrawing(true);
        prevPos.current = getMousePos(e);
    };

    const draw = (e) => {
        if (!isDrawing || !isDrawer || room?.gameStatus !== 'drawing') return;
        const currentPos = getMousePos(e);
        const line = { x0: prevPos.current.x, y0: prevPos.current.y, x1: currentPos.x, y1: currentPos.y, color, size: brushSize };

        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(line.x0, line.y0);
        ctx.lineTo(line.x1, line.y1);
        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.size;
        ctx.lineCap = 'round';
        ctx.stroke();

        socket.emit('draw:line', { roomCode, line });
        prevPos.current = currentPos;
    };

    const stopDrawing = () => setIsDrawing(false);
    const handleClear = () => isDrawer && socket.emit('draw:clear', { roomCode });
    const handleSelectWord = (word) => socket.emit('word:select', { roomCode, word }, (res) => res.success ? setSelectedWord(word) : alert('Failed to select word'));

    const handleSendGuess = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;
        socket.emit('guess:send', { roomCode, guess: inputText });
        setInputText('');
    };

    const handlePlayAgain = () => navigate('/lobby', { state: { returningRoomCode: roomCode } });
    const handleExitRoom = () => { socket.emit('room:leave'); navigate('/lobby', { state: { exited: true } }); };

    if (room?.gameStatus === 'game_over' || room?.status === 'game_over') {
        const sortedPlayers = room.players ? [...room.players].sort((a, b) => (b.score || 0) - (a.score || 0)) : [];
        return (
            <div className="card" style={{ maxWidth: '600px', margin: '20px auto', textAlign: 'center' }}>
                <h2>Game Over! 👑</h2>
                <div style={{ textAlign: 'left', marginTop: '20px' }}>
                    {sortedPlayers.map((p, idx) => (
                        <div key={p.socketId} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #ddd' }}>
                            <span>#{idx + 1} {p.username} {p.socketId === socket?.id && '(You)'}</span>
                            <strong>{p.score || 0} pts</strong>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button onClick={handlePlayAgain} style={{ flex: 1, backgroundColor: '#28a745' }}>Play Again</button>
                    <button onClick={handleExitRoom} style={{ flex: 1, backgroundColor: '#dc3545' }}>Exit Room</button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', gap: '20px', height: '100%' }}>

            {/* Players Panel */}
            <div className="card" style={{ width: '250px', overflowY: 'auto' }}>
                <h3>Players</h3>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {room?.players?.map(p => (
                        <li key={p.socketId} style={{ padding: '10px 0', borderBottom: '1px solid #ccc' }}>
                            <div>
                                <strong>{p.username}</strong>
                                {p.socketId === socket?.id ? ' (You)' : ''}
                                {room.currentDrawer === p.socketId ? ' 🎨 Drawer' : ''}
                            </div>
                            <div>Score: {p.score || 0}</div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Drawing/Main Panel */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>

                {/* Game Header */}
                <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px' }}>
                    {room?.gameStatus === 'word_selection' ? (
                        <h4>{isDrawer ? 'Choose a word to draw' : 'Drawer is choosing a word...'}</h4>
                    ) : room?.gameStatus === 'drawing' ? (
                        <>
                            <h4>
                                {isDrawer ? `Drawing: ${selectedWord}` : `Guessing: ${wordMessage}`}
                            </h4>
                            <h4 style={{ color: 'red' }}>Time: {timer}s</h4>
                        </>
                    ) : room?.gameStatus === 'round_end' ? (
                        <h4>Round Finished! Secret Word: {room?.currentWord}</h4>
                    ) : (
                        <h4>Waiting to start...</h4>
                    )}
                </div>

                {/* Modals for Word Selection and Round End */}
                {room?.gameStatus === 'word_selection' && isDrawer && (
                    <div className="card" style={{ backgroundColor: '#fff3cd' }}>
                        <h4>Select a word:</h4>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            {room?.wordOptions?.map(word => (
                                <button key={word} onClick={() => handleSelectWord(word)} style={{ flex: 1 }}>{word}</button>
                            ))}
                        </div>
                    </div>
                )}
                {roundEndData && (
                    <div className="card" style={{ backgroundColor: '#d1ecf1' }}>
                        <h4>Round Over! Word was: {roundEndData.word}</h4>
                    </div>
                )}

                {/* Canvas Container */}
                <div style={{ flex: 1, border: '2px solid #ccc', backgroundColor: '#fff', minHeight: '400px' }}>
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseOut={stopDrawing}
                        onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                        style={{ display: 'block', touchAction: 'none', width: '100%', height: '100%', cursor: isDrawer ? 'crosshair' : 'default' }}
                    />
                </div>

                {/* Toolbar */}
                {isDrawer && room?.gameStatus === 'drawing' && (
                    <div className="card" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            {colorsPalette.map(c => (
                                <div
                                    key={c}
                                    onClick={() => setColor(c)}
                                    style={{ width: '25px', height: '25px', backgroundColor: c, border: color === c ? '2px solid black' : '1px solid #ccc', cursor: 'pointer' }}
                                />
                            ))}
                        </div>
                        <div>
                            <label>Size: </label>
                            <input type="range" min="1" max="50" value={brushSize} onChange={e => setBrushSize(parseInt(e.target.value))} />
                        </div>
                        <button onClick={handleClear} style={{ backgroundColor: '#dc3545', marginLeft: 'auto' }}>Clear</button>
                    </div>
                )}
            </div>

            {/* Chat Panel */}
            <div className="card" style={{ width: '250px', display: 'flex', flexDirection: 'column' }}>
                <h3>Chat & Guesses</h3>

                <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #ccc', padding: '10px', marginBottom: '10px', backgroundColor: '#fafafa' }}>
                    {messages.map(msg => (
                        <div key={msg.id} style={{ marginBottom: '5px' }}>
                            {msg.type === 'correct' ? (
                                <strong style={{ color: 'green' }}>{msg.username} guessed the word!</strong>
                            ) : (
                                <span><strong>{msg.username}:</strong> {msg.text}</span>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendGuess} style={{ display: 'flex', gap: '5px' }}>
                    <input
                        type="text"
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        placeholder="Type guess..."
                        disabled={isDrawer || localPlayer?.hasGuessed}
                        style={{ flex: 1, minWidth: 0 }}
                    />
                    <button type="submit" disabled={isDrawer || localPlayer?.hasGuessed}>Send</button>
                </form>
            </div>

        </div>
    );
}
