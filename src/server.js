const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);

// [1] Socket.io 설정
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// [2] 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// [3] 로깅 미들웨어
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`📡 [${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// [4] 정적 파일 설정
const uploadPath = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadPath)) { fs.mkdirSync(uploadPath); }
app.use('/uploads', express.static(uploadPath));

// [5] 라우터 임포트
const authRoutes = require('./routes/auth.routes');
const postRoutes = require('./routes/post.routes');
const dmRoutes = require('./routes/dm.routes');
const notificationRoutes = require('./routes/notificationRoutes');
const commentRoutes = require('./routes/comment.routes');
// [Fact] 누락되었던 chatRoutes 임포트 추가
const chatRoutes = require('./routes/chat.routes');

// [6] API 등록 구역

// 비밀번호 찾기
app.post('/api/auth/find-password', async (req, res) => {
    const { email } = req.body;
    console.log(`🔑 비밀번호 재설정 시도 이메일: ${email}`);
    return res.status(200).json({
        message: "비밀번호 재설정 안내가 이메일로 전송되었습니다. 🫧"
    });
});

// 핵심 서비스 라우터 등록
app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/dm', dmRoutes);
app.use('/api/notifications', notificationRoutes);

// [Fact] 프론트엔드에서 /api/chat/detail 등으로 요청하므로 아래 등록이 필수입니다.
app.use('/api/chat', chatRoutes);

// 신고/리포트 관련 처리
app.use('/api/reports', postRoutes);

// [7] Socket.io 이벤트 로직
io.on('connection', (socket) => {
    socket.on('join', (userId) => { if (userId) socket.join(userId); });
    socket.on('disconnect', () => { });
});

// [8] 404 및 에러 핸들러
app.use((req, res) => {
    res.status(404).json({ message: `요청하신 경로(${req.originalUrl})를 찾을 수 없습니다.` });
});

// [9] 서버 시작
const PORT = process.env.PORT || 5001;
server.listen(PORT, async () => {
    console.log(`✅ Server running on port ${PORT}`);
    try {
        await prisma.$connect();
        console.log('✅ MySQL(Prisma) 연동 확인 완료');
    } catch (err) {
        console.error('❌ MySQL 연동 실패:', err.message);
    }
});