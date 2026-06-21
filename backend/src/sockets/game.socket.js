import { rooms, emitRoomUpdate } from './room.socket.js';

export const registerGameHandlers = (io, socket) => {
    socket.on('word:select', ({ roomCode, word }, callback) => {
        try {
            if (!roomCode || !word) {
                if (callback) callback({ success: false, message: 'Invalid payload' });
                return;
            }

            const room = rooms.get(roomCode);
            if (!room) {
                if (callback) callback({ success: false, message: 'Room not found' });
                return;
            }

            // Security: verify the player is in that room
            const isPlayerInRoom = room.players.some(p => p.socketId === socket.id);
            if (!isPlayerInRoom) {
                if (callback) callback({ success: false, message: 'Unauthorized: not a member of this room' });
                return;
            }

            // Security: only current drawer can select
            if (room.currentDrawer !== socket.id) {
                if (callback) callback({ success: false, message: 'Only the active drawer can select the word' });
                return;
            }

            // Security: verify word exists in generated options
            if (!room.wordOptions || !room.wordOptions.includes(word)) {
                if (callback) callback({ success: false, message: 'Word is not an available option' });
                return;
            }

            // Save selected word and update state
            room.currentWord = word;
            room.gameStatus = 'drawing';

            // Emit word:selected event to all room players securely
            const roomSockets = io.sockets.adapter.rooms.get(roomCode);
            if (roomSockets) {
                for (const socketId of roomSockets) {
                    const clientSocket = io.sockets.sockets.get(socketId);
                    if (clientSocket) {
                        if (socketId === room.currentDrawer) {
                            clientSocket.emit('word:selected', { word });
                        } else {
                            clientSocket.emit('word:selected', { message: 'Drawer selected a word' });
                        }
                    }
                }
            }

            // Update room state for all clients in the room
            emitRoomUpdate(io, roomCode);

            if (callback) callback({ success: true });
        } catch (err) {
            console.error('Error in word:select:', err);
            if (callback) callback({ success: false, message: 'Server error' });
        }
    });
};
