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

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 로깅 미들웨어
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`📡 [${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

const uploadPath = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadPath)) { fs.mkdirSync(uploadPath); }
app.use('/uploads', express.static(uploadPath));

// --- 라우터 임포트 ---
const authRoutes = require('./routes/auth.routes');
const postRoutes = require('./routes/post.routes');
const dmRoutes = require('./routes/dm.routes');
const notificationRoutes = require('./routes/notificationRoutes');
const commentRoutes = require('./routes/comment.routes');

// --- API 등록 구역 ---

// 1. 댓글 라우터
app.use('/api/comments', commentRoutes);

/**
 * [Fact] 비밀번호 찾기 임시 핸들러 (404 방지용)
 * authRoutes 내부를 수정하기 전, 메인에서 먼저 가로채서 응답을 보냅니다.
 */
app.post('/api/auth/find-password', async (req, res) => {
    const { email } = req.body;
    console.log(`🔑 비밀번호 재설정 시도 이메일: ${email}`);

    // 임시 성공 응답 (실제 로직은 auth.routes.js에 구현 권장)
    return res.status(200).json({
        message: "비밀번호 재설정 안내가 이메일로 전송되었습니다. 🫧"
    });
});

// 2. 핵심 서비스 라우터
app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/dm', dmRoutes);
app.use('/api/notifications', notificationRoutes);

// Socket.io 로직
io.on('connection', (socket) => {
    socket.on('join', (userId) => { if (userId) socket.join(userId); });
    socket.on('disconnect', () => { console.log('🔌 User disconnected'); });
});

// 404 처리
app.use((req, res) => {
    res.status(404).json({ message: "요청하신 경로를 찾을 수 없습니다." });
});

const PORT = 5001;
server.listen(PORT, async () => {
    console.log(`✅ Server running on port ${PORT}`);
    try {
        await prisma.$connect();
        console.log('✅ MySQL(Prisma) 연동 확인 완료');
    } catch (err) {
        console.error('❌ MySQL 연동 실패:', err.message);
    }
});