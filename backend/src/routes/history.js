import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Match history route' });
});

export default router;
