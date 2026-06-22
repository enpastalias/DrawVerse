import Match from '../models/Match.js';

// @desc    Get user match history
// @route   GET /api/history
// @access  Private
export const getMyHistory = async (req, res, next) => {
    try {
        const matches = await Match.find({ 'players.userId': req.user._id })
            .sort({ createdAt: -1 })
            .limit(20); // Limit to last 20 matches for performance

        res.json(matches);
    } catch (error) {
        next(error);
    }
};
