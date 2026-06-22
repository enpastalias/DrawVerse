import express from 'express';
import { getMyHistory } from '../controllers/historyController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getMyHistory);

export default router;
