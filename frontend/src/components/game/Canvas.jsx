import React, { useRef, useEffect, useState, useContext } from 'react';
import { SocketContext } from '../../context/SocketContext';

export default function Canvas({ roomCode }) {
    const canvasRef = useRef(null);
    const { socket } = useContext(SocketContext);

    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(5);

    const prevPos = useRef({ x: 0, y: 0 });

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
            socket.emit('draw:request_history', { roomCode });

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
                socket.off('draw:history');
                socket.off('draw:line');
                socket.off('draw:clear');
            }
        };
    }, [socket, roomCode]);

    const startDrawing = (e) => {
        setIsDrawing(true);
        const pos = getMousePos(e);
        prevPos.current = pos;
    };

    const draw = (e) => {
        if (!isDrawing) return;

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
        if (socket) {
            socket.emit('draw:clear', { roomCode });
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
            <div style={{ display: 'flex', gap: '10px', padding: '10px', background: '#ccc' }}>
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
            </div>
            <div style={{ flex: 1, border: '1px solid black', overflow: 'hidden' }}>
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
