import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema(
    {
        roomCode: {
            type: String,
            required: true
        },
        players: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: false // Allow guest players
                },
                username: {
                    type: String,
                    required: true
                },
                score: {
                    type: Number,
                    required: true,
                    default: 0
                },
                rank: {
                    type: Number,
                    required: true
                }
            }
        ],
        rounds: {
            type: Number,
            required: true,
            default: 3
        },
        winner: {
            username: {
                type: String,
                required: true
            },
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: false
            },
            score: {
                type: Number,
                required: true
            }
        }
    },
    { timestamps: true }
);

const Match = mongoose.model('Match', matchSchema);
export default Match;
