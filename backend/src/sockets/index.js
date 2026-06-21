import { registerRoomHandlers } from './room.socket.js';
import { registerGameHandlers } from './game.socket.js';
import { registerChatHandlers } from './chat.socket.js';
import { registerDrawingHandlers } from './drawing.socket.js';

export const registerSockets = (io) => {
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        registerRoomHandlers(io, socket);
        registerGameHandlers(io, socket);
        registerChatHandlers(io, socket);
        registerDrawingHandlers(io, socket);

        // Common disconnect handled inside room.socket.js for room cleanup
        // but explicit general disconnect if needed.
    });
};
