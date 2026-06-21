import User from '../models/User.js';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                avatarUrl: user.avatarUrl,
                status: user.status,
                totalMatches: user.totalMatches,
                matchesWon: user.matchesWon
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};
