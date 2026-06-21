import { getRandomWords } from '../utils/words.js';

// In-memory room storage
export const rooms = new Map();

/**
 * Broadcasts room state to all clients in the room securely.
 * Redacts secret information (wordOptions and currentWord) from players who are not the current drawer.
 */
export const emitRoomUpdate = (io, roomCode) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    // Get all sockets currently in the room
    const roomSockets = io.sockets.adapter.rooms.get(roomCode);
    if (roomSockets) {
        for (const socketId of roomSockets) {
            const clientSocket = io.sockets.sockets.get(socketId);
            if (clientSocket) {
                // Perform a shallow clone of the room state
                const customizedRoom = { ...room };

                // Strip secret fields if this socket is NOT the current drawer
                if (room.currentDrawer !== socketId) {
                    delete customizedRoom.wordOptions;
                    delete customizedRoom.currentWord;
                }

                clientSocket.emit('room:update', customizedRoom);
            }
        }
    }
};

export const registerRoomHandlers = (io, socket) => {
    socket.on('room:create', ({ username, userId }, callback) => {
        try {
            // Generate simple room code
            const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

            const newRoom = {
                roomCode,
                host: socket.id, // For now use socket.id as host identifier
                players: [{ socketId: socket.id, username, userId, isHost: true, hasGuessed: false }],
                maxPlayers: 8,
                status: 'waiting',
                settings: { rounds: 3, drawTime: 80 }
            };

            rooms.set(roomCode, newRoom);
            socket.join(roomCode);
            socket.roomCode = roomCode; // Store on socket instance

            socket.emit('room:created', { roomCode });
            emitRoomUpdate(io, roomCode);

            if (callback) callback({ success: true, roomCode });
        } catch (err) {
            socket.emit('room:error', { message: 'Failed to create room' });
            if (callback) callback({ success: false, message: 'Failed to create room' });
        }
    });

    socket.on('room:join', ({ roomCode, username, userId }, callback) => {
        try {
            const room = rooms.get(roomCode);

            if (!room) {
                if (callback) callback({ success: false, message: 'Room not found' });
                return socket.emit('room:error', { message: 'Room not found' });
            }

            if (room.players.length >= room.maxPlayers) {
                if (callback) callback({ success: false, message: 'Room is full' });
                return socket.emit('room:error', { message: 'Room is full' });
            }

            if (room.status !== 'waiting') {
                if (callback) callback({ success: false, message: 'Game already playing' });
                return socket.emit('room:error', { message: 'Game already playing' });
            }

            const player = { socketId: socket.id, username, userId, isHost: false, hasGuessed: false };
            room.players.push(player);

            socket.join(roomCode);
            socket.roomCode = roomCode;

            socket.emit('room:joined', { roomCode });
            socket.to(roomCode).emit('room:player_joined', player);

            emitRoomUpdate(io, roomCode);
            if (callback) callback({ success: true, roomCode });
        } catch (err) {
            if (callback) callback({ success: false, message: 'Server error' });
        }
    });

    socket.on('room:get', ({ roomCode }, callback) => {
        try {
            const room = rooms.get(roomCode);
            if (room) {
                // Emit customized room state to the single socket requesting it
                const customizedRoom = { ...room };
                if (room.currentDrawer !== socket.id) {
                    delete customizedRoom.wordOptions;
                    delete customizedRoom.currentWord;
                }
                socket.emit('room:update', customizedRoom);

                if (callback) callback({ success: true, room: customizedRoom });
            } else {
                if (callback) callback({ success: false, message: 'Room not found' });
            }
        } catch (err) {
            if (callback) callback({ success: false, message: 'Server error' });
        }
    });

    socket.on('room:start', () => {
        const roomCode = socket.roomCode;
        if (!roomCode) return;
        const room = rooms.get(roomCode);
        if (!room) return;

        if (room.host !== socket.id) {
            return socket.emit('room:error', { message: 'Only host can start the game' });
        }

        console.log(`[game:start] BEFORE: roomId: ${roomCode}, socket.id: ${socket.id}, players: ${JSON.stringify(room.players)}, hostId: ${room.host}`);

        room.status = 'playing';
        room.currentDrawer = room.host; // Assign the host as the initial drawer
        room.gameStatus = 'word_selection'; // Update game state status to word_selection
        room.currentWord = null;
        room.wordOptions = getRandomWords(3); // Choose 3 random options
        room.players.forEach(p => {
            p.hasGuessed = false;
        });

        console.log(`[game:start] AFTER: roomId: ${roomCode}, socket.id: ${socket.id}, players: ${JSON.stringify(room.players)}, hostId: ${room.host}, currentDrawer: ${room.currentDrawer}, options: ${JSON.stringify(room.wordOptions)}`);

        emitRoomUpdate(io, roomCode);
        io.to(roomCode).emit('game:started', { roomCode });
    });

    socket.on('room:leave', () => {
        handleDisconnect(io, socket);
    });

    socket.on('disconnect', () => {
        handleDisconnect(io, socket);
    });
};

const handleDisconnect = (io, socket) => {
    const roomCode = socket.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (room) {
        room.players = room.players.filter(p => p.socketId !== socket.id);

        if (room.players.length === 0) {
            rooms.delete(roomCode); // Clean up empty rooms
        } else {
            // Re-assign host if host left
            if (room.host === socket.id) {
                room.host = room.players[0].socketId;
                room.players[0].isHost = true;
            }
            socket.to(roomCode).emit('room:player_left', { socketId: socket.id });
            emitRoomUpdate(io, roomCode);
        }
    }

    socket.leave(roomCode);
    socket.roomCode = null;
};
