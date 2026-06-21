import { rooms, emitRoomUpdate, startRoomTimer, stopRoomTimer, endRound } from './room.socket.js';

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

            // Reset correct guess flag for all players
            room.players.forEach(p => {
                p.hasGuessed = false;
            });

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

            // Start room timer countdown
            startRoomTimer(io, roomCode);

            if (callback) callback({ success: true });
        } catch (err) {
            console.error('Error in word:select:', err);
            if (callback) callback({ success: false, message: 'Server error' });
        }
    });

    socket.on('guess:send', ({ roomCode, guess }) => {
        try {
            if (!roomCode || !guess) return;

            const room = rooms.get(roomCode);
            if (!room) return;

            // Verify game status is "drawing"
            if (room.status !== 'playing' || room.gameStatus !== 'drawing') return;

            // Find matching player
            const player = room.players.find(p => p.socketId === socket.id);
            if (!player) return;

            // Security: drawer cannot guess
            if (room.currentDrawer === socket.id) return;

            // Security: player who already guessed cannot guess again
            if (player.hasGuessed) return;

            const trimmedGuess = guess.trim();
            if (!trimmedGuess) return;

            const cleanedGuess = trimmedGuess.toLowerCase();
            const cleanedWord = room.currentWord.trim().toLowerCase();

            if (cleanedGuess === cleanedWord) {
                player.hasGuessed = true;

                // Calculate points: score = 100 + remainingTime
                const remainingTime = room.timer || 0;
                const pointsEarned = 100 + remainingTime;
                player.score = (player.score || 0) + pointsEarned;
                if (!room.scores) room.scores = {};
                room.scores[player.username] = player.score;

                if (!room.roundScores) room.roundScores = {};
                room.roundScores[player.username] = pointsEarned;

                // Broadcast correct guess
                io.to(roomCode).emit('guessed:correct', {
                    username: player.username,
                    message: `${player.username} guessed the word!`
                });

                // Check if all players (who are not the drawer) have guessed correctly
                const guessers = room.players.filter(p => p.socketId !== room.currentDrawer);
                const allGuessed = guessers.length > 0 && guessers.every(p => p.hasGuessed);

                if (allGuessed) {
                    stopRoomTimer(roomCode);
                    endRound(io, roomCode);
                } else {
                    emitRoomUpdate(io, roomCode);
                }
            } else {
                // Broadcast wrong guess
                io.to(roomCode).emit('guess:message', {
                    username: player.username,
                    guess: trimmedGuess
                });
            }
        } catch (err) {
            console.error('Error in guess:send:', err);
        }
    });
};
