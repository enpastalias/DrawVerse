import express from 'express';
import cors from 'cors';
import { notFound, errorHandler } from './middlewares/errorHandler.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import friendRoutes from './routes/friends.js';
import roomRoutes from './routes/rooms.js';
import historyRoutes from './routes/history.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/history', historyRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
