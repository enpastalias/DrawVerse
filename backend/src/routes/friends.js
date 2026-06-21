import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Friends list route' });
});

export default router;
