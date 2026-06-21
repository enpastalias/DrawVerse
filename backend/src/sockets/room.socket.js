// In-memory room storage
const rooms = new Map();

export const registerRoomHandlers = (io, socket) => {
    const emitRoomUpdate = (roomCode) => {
        const room = rooms.get(roomCode);
        if (room) {
            io.to(roomCode).emit('room:update', room);
        }
    };

    socket.on('room:create', ({ username, userId }, callback) => {
        try {
            // Generate simple room code
            const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

            const newRoom = {
                roomCode,
                host: socket.id, // For now use socket.id as host identifier
                players: [{ socketId: socket.id, username, userId, isHost: true }],
                maxPlayers: 8,
                status: 'waiting',
                settings: { rounds: 3, drawTime: 80 }
            };

            rooms.set(roomCode, newRoom);
            socket.join(roomCode);
            socket.roomCode = roomCode; // Store on socket instance

            socket.emit('room:created', { roomCode });
            emitRoomUpdate(roomCode);

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

            const player = { socketId: socket.id, username, userId, isHost: false };
            room.players.push(player);

            socket.join(roomCode);
            socket.roomCode = roomCode;

            socket.emit('room:joined', { roomCode });
            socket.to(roomCode).emit('room:player_joined', player);

            emitRoomUpdate(roomCode);
            if (callback) callback({ success: true, roomCode });
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

        room.status = 'playing';
        io.to(roomCode).emit('room:update', room);
        io.to(roomCode).emit('game:started');
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
            io.to(roomCode).emit('room:update', room);
        }
    }

    socket.leave(roomCode);
    socket.roomCode = null;
};
