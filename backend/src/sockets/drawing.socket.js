import { rooms } from './room.socket.js';

const roomCanvases = new Map();

export const registerDrawingHandlers = (io, socket) => {
    // Send current canvas state when someone requests it
    socket.on('draw:request_history', ({ roomCode }) => {
        const history = roomCanvases.get(roomCode) || [];
        socket.emit('draw:history', history);
    });

    // Relay and store line segments
    socket.on('draw:line', ({ roomCode, line }) => {
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room) return;

        // Verify the sender is the current assigned drawer
        if (room.currentDrawer !== socket.id) {
            return;
        }

        // Keep room isolation: verify player is registered in this room
        const isPlayerInRoom = room.players.some(p => p.socketId === socket.id);
        if (!isPlayerInRoom) return;

        if (!roomCanvases.has(roomCode)) {
            roomCanvases.set(roomCode, []);
        }

        roomCanvases.get(roomCode).push(line);

        // Broadcast to others in the room
        socket.to(roomCode).emit('draw:line', line);
    });

    // Clear canvas
    socket.on('draw:clear', ({ roomCode }) => {
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room) return;

        // Verify the sender is the current assigned drawer
        if (room.currentDrawer !== socket.id) {
            return;
        }

        // Keep room isolation: verify player is registered in this room
        const isPlayerInRoom = room.players.some(p => p.socketId === socket.id);
        if (!isPlayerInRoom) return;

        roomCanvases.set(roomCode, []);

        // Broadcast clear event to all clients in the room including the sender (the drawer)
        io.to(roomCode).emit('draw:clear');
    });

    // Automatically clean up memory when a room gets deleted from room.socket.js
    // (We could expose a method from room.socket.js, or just listen to an internal event,
    // but for MVP, we just keep it simple).
};
