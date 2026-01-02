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

// Socket.io 설정
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// 1. 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. 강제 로그 미들웨어 (이게 안 찍히면 프론트 주소 설정 오류임)
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`📡 [${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// 3. 정적 파일 및 업로드 경로 설정
const uploadPath = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadPath)) { fs.mkdirSync(uploadPath); }
app.use('/uploads', express.static(uploadPath));

// 4. 라우터 연결 (반드시 /api 접두사 확인)
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/posts', require('./routes/post.routes'));
app.use('/api/dm', require('./routes/dm.routes'));
app.use('/api/users', require('./routes/user.routes'));

// 5. Socket.io 로직
io.on('connection', (socket) => {
    socket.on('joinSelf', (userId) => { socket.join(userId); });

    socket.on('joinRoom', async ({ roomId, userId }) => {
        socket.join(roomId);
        try {
            await prisma.message.updateMany({
                where: { senderId: roomId, receiverId: userId, isRead: false },
                data: { isRead: true }
            });
            io.to(roomId).emit('messagesRead', { readerId: userId });
        } catch (err) { console.error("❌ Socket joinRoom 에러:", err); }
    });

    socket.on('sendDm', async (data) => {
        const { receiverId, senderId, content } = data;
        try {
            const newMessage = await prisma.message.create({
                data: { senderId, receiverId, content, isRead: false }
            });
            io.to(receiverId).to(senderId).emit('receiveDm', { ...newMessage });
        } catch (err) { console.error("❌ Socket sendDm 에러:", err); }
    });

    socket.on('disconnect', () => { /* 접속 해제 로그 생략 가능 */ });
});

// 6. 404 처리
app.use((req, res) => {
    console.log(`⚠️ 404 발생: [${req.method}] ${req.originalUrl}`);
    res.status(404).json({ message: "요청하신 경로를 찾을 수 없습니다." });
});

// 7. 글로벌 에러 핸들러 (중요: 서버 다운 방지 및 에러 로그 기록)
app.use((err, req, res, next) => {
    console.error('❌ 서버 내부 에러:', err);
    res.status(500).json({ message: "서버에서 오류가 발생했습니다.", error: err.message });
});

const PORT = 5001;
server.listen(PORT, () => {
    console.log('✅ MySQL(Prisma) 연동 준비 완료');
    console.log(`✅ Server running on port ${PORT}`);
});