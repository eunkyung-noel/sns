const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware'); // 경로 통일
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.post('/:postId', auth, async (req, res) => {
    try {
        const { content } = req.body;
        const comment = await prisma.comment.create({
            data: { content, postId: req.params.postId, authorId: req.user.id }
        });
        res.json(comment);
    } catch (err) { res.status(500).json({ message: "실패" }); }
});

module.exports = router;