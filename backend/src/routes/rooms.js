import express from 'express';
const router = express.Router();

router.post('/', (req, res) => {
    res.json({ message: 'Create room route' });
});

export default router;
