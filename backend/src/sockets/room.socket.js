import { getRandomWords } from '../utils/words.js';
import { clearCanvasHistory } from './drawing.socket.js';
import Match from '../models/Match.js';
import User from '../models/User.js';

// In-memory room storage
export const rooms = new Map();
const roomIntervals = new Map();

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
                if (room.currentDrawer !== socketId && room.gameStatus !== 'round_end') {
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
                players: [{ socketId: socket.id, username, userId, isHost: true, hasGuessed: false, score: 0 }],
                maxPlayers: 8,
                status: 'waiting',
                settings: { rounds: 3, drawTime: 80 },
                scores: { [username]: 0 }
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

            // Check if player is reconnecting
            const existingPlayerIndex = room.players.findIndex(p => 
                (userId && userId !== 'guest' && p.userId === userId) || 
                (p.username === username)
            );

            if (existingPlayerIndex !== -1) {
                const existingPlayer = room.players[existingPlayerIndex];
                const oldSocketId = existingPlayer.socketId;
                
                // Update socket ID
                existingPlayer.socketId = socket.id;
                
                // Update host if needed
                if (room.host === oldSocketId) {
                    room.host = socket.id;
                }
                
                // Update current drawer if needed
                if (room.currentDrawer === oldSocketId) {
                    room.currentDrawer = socket.id;
                }

                socket.join(roomCode);
                socket.roomCode = roomCode;

                socket.emit('room:joined', { roomCode });
                emitRoomUpdate(io, roomCode);
                
                if (callback) callback({ success: true, roomCode, reconnected: true });
                return;
            }

            if (room.players.length >= room.maxPlayers) {
                if (callback) callback({ success: false, message: 'Room is full' });
                return socket.emit('room:error', { message: 'Room is full' });
            }

            if (room.status !== 'waiting') {
                if (callback) callback({ success: false, message: 'Game already playing' });
                return socket.emit('room:error', { message: 'Game already playing' });
            }

            const player = { socketId: socket.id, username, userId, isHost: false, hasGuessed: false, score: 0 };
            room.players.push(player);
            if (!room.scores) room.scores = {};
            room.scores[username] = 0;

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
                if (room.currentDrawer !== socket.id && room.gameStatus !== 'round_end') {
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

    socket.on('room:start', (customSettings) => {
        const roomCode = socket.roomCode;
        if (!roomCode) return;
        const room = rooms.get(roomCode);
        if (!room) return;

        if (room.host !== socket.id) {
            return socket.emit('room:error', { message: 'Only host can start the game' });
        }

        if (customSettings) {
            room.settings = {
                rounds: parseInt(customSettings.rounds) || 3,
                drawTime: parseInt(customSettings.drawTime) || 80
            };
        }

        console.log(`[game:start] BEFORE: roomId: ${roomCode}, socket.id: ${socket.id}, players: ${JSON.stringify(room.players)}, hostId: ${room.host}`);

        room.status = 'playing';
        room.currentRound = 1;
        room.drawerIndex = 0;
        room.currentDrawer = room.host; // Assign the host as the initial drawer
        room.gameStatus = 'word_selection'; // Update game state status to word_selection
        room.currentWord = null;
        room.wordOptions = getRandomWords(3); // Choose 3 random options
        room.scores = {};
        room.players.forEach(p => {
            p.hasGuessed = false;
            p.score = 0;
            room.scores[p.username] = 0;
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
        const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
        const player = playerIndex !== -1 ? room.players[playerIndex] : null;

        if (player) {
            room.players = room.players.filter(p => p.socketId !== socket.id);

            if (room.players.length === 0) {
                stopRoomTimer(roomCode);
                clearCanvasHistory(roomCode);
                rooms.delete(roomCode); // Clean up empty rooms
            } else {
                // Re-assign host if host left
                if (room.host === socket.id) {
                    room.host = room.players[0].socketId;
                    room.players[0].isHost = true;
                }

                socket.to(roomCode).emit('room:player_left', { socketId: socket.id });

                if (room.status === 'playing') {
                    // Handle active drawer disconnecting
                    if (room.currentDrawer === socket.id) {
                        stopRoomTimer(roomCode);
                        io.to(roomCode).emit('guess:message', {
                            username: 'System',
                            guess: `${player.username} (Drawer) left the room. Advancing turn.`
                        });

                        // Adjust drawerIndex since array size changed
                        if (room.drawerIndex >= room.players.length) {
                            room.drawerIndex = 0;
                        }

                        // Advance the game flow without incrementing drawerIndex
                        advanceGameFlow(io, roomCode, false);
                    } else {
                        // If it's a guesser who left, adjust drawer index if they were before the current drawer
                        if (playerIndex < room.drawerIndex) {
                            room.drawerIndex -= 1;
                        }

                        // Check if remaining guessers have all guessed correctly
                        const guessers = room.players.filter(p => p.socketId !== room.currentDrawer);
                        const allGuessed = guessers.length > 0 && guessers.every(p => p.hasGuessed);

                        if (allGuessed && room.gameStatus === 'drawing') {
                            stopRoomTimer(roomCode);
                            endRound(io, roomCode);
                        } else {
                            emitRoomUpdate(io, roomCode);
                        }
                    }
                } else {
                    emitRoomUpdate(io, roomCode);
                }
            }
        }
    }

    socket.leave(roomCode);
    socket.roomCode = null;
};

export const stopRoomTimer = (roomCode) => {
    if (roomIntervals.has(roomCode)) {
        clearInterval(roomIntervals.get(roomCode));
        roomIntervals.delete(roomCode);
    }
};

export const endRound = (io, roomCode) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    room.gameStatus = 'round_end';

    // Calculate drawer's points
    const correctGuesses = room.players.filter(p => p.socketId !== room.currentDrawer && p.hasGuessed).length;
    const drawerPoints = correctGuesses * 50;

    const drawer = room.players.find(p => p.socketId === room.currentDrawer);
    if (drawer) {
        drawer.score = (drawer.score || 0) + drawerPoints;
        if (!room.scores) room.scores = {};
        room.scores[drawer.username] = drawer.score;
        if (drawerPoints > 0) {
            if (!room.roundScores) room.roundScores = {};
            room.roundScores[drawer.username] = drawerPoints;
        }
    }

    emitRoomUpdate(io, roomCode);

    // Broadcast round:end event
    io.to(roomCode).emit('round:end', {
        word: room.currentWord,
        roundScores: room.roundScores || {}
    });

    // Set timer for next turn transition (8 seconds intermission)
    setTimeout(() => {
        advanceGameFlow(io, roomCode).catch(err => {
            console.error('Error advancing game flow:', err);
        });
    }, 8000);
};

export const startRoomTimer = (io, roomCode) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    stopRoomTimer(roomCode);

    room.timer = room.settings?.drawTime || 60;
    room.roundScores = {};

    // Ensure room.scores is initialized
    if (!room.scores) {
        room.scores = {};
    }
    room.players.forEach(p => {
        room.scores[p.username] = p.score || 0;
    });

    emitRoomUpdate(io, roomCode);
    io.to(roomCode).emit('timer:update', { time: room.timer });

    const interval = setInterval(() => {
        const currentRoom = rooms.get(roomCode);
        if (!currentRoom || currentRoom.status !== 'playing' || currentRoom.gameStatus !== 'drawing') {
            clearInterval(interval);
            roomIntervals.delete(roomCode);
            return;
        }

        currentRoom.timer -= 1;
        io.to(roomCode).emit('timer:update', { time: currentRoom.timer });

        const guessers = currentRoom.players.filter(p => p.socketId !== currentRoom.currentDrawer);
        const allGuessed = guessers.length > 0 && guessers.every(p => p.hasGuessed);

        if (currentRoom.timer <= 0 || allGuessed) {
            clearInterval(interval);
            roomIntervals.delete(roomCode);
            endRound(io, roomCode);
        }
    }, 1000);

    roomIntervals.set(roomCode, interval);
};

export const advanceGameFlow = async (io, roomCode, shouldIncrementDrawer = true) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    if (room.status !== 'playing') return;

    if (shouldIncrementDrawer) {
        room.drawerIndex += 1;
    }

    if (room.drawerIndex >= room.players.length) {
        room.currentRound += 1;
        room.drawerIndex = 0;
    }

    if (room.currentRound > (room.settings?.rounds || 3)) {
        await handleGameOver(io, roomCode);
    } else {
        if (room.players.length === 0) {
            rooms.delete(roomCode);
            clearCanvasHistory(roomCode);
            return;
        }

        const nextPlayer = room.players[room.drawerIndex];
        room.currentDrawer = nextPlayer.socketId;
        room.gameStatus = 'word_selection';
        room.currentWord = null;
        room.wordOptions = getRandomWords(3);
        
        room.players.forEach(p => {
            p.hasGuessed = false;
        });

        clearCanvasHistory(roomCode);
        io.to(roomCode).emit('draw:clear');
        emitRoomUpdate(io, roomCode);
    }
};

export const handleGameOver = async (io, roomCode) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    room.status = 'game_over';
    room.gameStatus = 'game_over';

    // Sort players by score to calculate rankings
    const rankedPlayers = [...room.players]
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .map((p, idx) => ({
            userId: p.userId,
            username: p.username,
            score: p.score || 0,
            rank: idx + 1
        }));

    const winnerPlayer = rankedPlayers[0];

    try {
        const matchData = {
            roomCode,
            players: rankedPlayers,
            rounds: room.settings?.rounds || 3,
            winner: {
                username: winnerPlayer.username,
                userId: winnerPlayer.userId !== 'guest' ? winnerPlayer.userId : undefined,
                score: winnerPlayer.score
            }
        };

        const savedMatch = await Match.create(matchData);
        console.log(`[game:over] Match persisted successfully: ${savedMatch._id}`);

        // Update statistics for all registered players in the room
        for (const p of room.players) {
            if (p.userId && p.userId !== 'guest') {
                const isWinner = p.username === winnerPlayer.username;
                await User.findByIdAndUpdate(p.userId, {
                    $inc: {
                        totalMatches: 1,
                        matchesWon: isWinner ? 1 : 0
                    }
                });
                console.log(`[game:over] Updated statistics for user ${p.username}`);
            }
        }
    } catch (err) {
        console.error('[game:over] Error saving match or updating stats:', err);
    }

    // Broadcast game:over event to all clients
    io.to(roomCode).emit('game:over', {
        rankings: rankedPlayers,
        winner: winnerPlayer,
        scores: room.scores
    });

    emitRoomUpdate(io, roomCode);
};
