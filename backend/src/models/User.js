import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, 'Please add a username'],
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 20
        },
        email: {
            type: String,
            required: [true, 'Please add an email'],
            unique: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please add a valid email'
            ]
        },
        passwordHash: {
            type: String,
            required: [true, 'Please add a password'],
            minlength: 6,
            select: false
        },
        avatarUrl: {
            type: String,
            default: ''
        },
        status: {
            type: String,
            enum: ['online', 'offline', 'in-game'],
            default: 'offline'
        },
        totalMatches: {
            type: Number,
            default: 0
        },
        matchesWon: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.passwordHash);
};

const User = mongoose.model('User', userSchema);
export default User;
