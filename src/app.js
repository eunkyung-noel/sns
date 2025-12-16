const express = require('express');
const cors = require('cors');
require('dotenv').config();

// 1. 모든 라우트 파일들을 불러옵니다.
const authRoutes = require('./routes/auth.routes');
const postRoutes = require('./routes/post.routes');
const dmRoutes = require('./routes/dm.routes');
const followRoutes = require('./routes/follow.routes');
const reportRoutes = require('./routes/report.routes');
const userRoutes = require('./routes/user.routes');
const commentRoutes = require('./routes/comment.routes'); // 댓글 라우트

const app = express();

app.use(cors());
app.use(express.json());

// 2. 모든 라우트들을 마운트함.
app.use('/auth', authRoutes);
app.use('/posts', postRoutes);
app.use('/dm', dmRoutes);
app.use('/follow', followRoutes);
app.use('/report', reportRoutes);
app.use('/users', userRoutes);
app.use('/comments', commentRoutes); //  댓글 경로

app.get('/', (req, res) => {
    res.send('Safe SNS API is running');
});

module.exports = app;