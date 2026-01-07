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

// 라우터 임포트
const authRoutes = require('./routes/auth.routes');
const postRoutes = require('./routes/post.routes');
const dmRoutes = require('./routes/dm.routes');
const notificationRoutes = require('./routes/notificationRoutes');

// API 등록
app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/dm', dmRoutes);
app.use('/api/notifications', notificationRoutes);

// Socket.io 로직
io.on('connection', (socket) => {
    socket.on('join', (userId) => {
        if (userId) {
            socket.join(userId);
            console.log(`👤 User joined room: ${userId}`);
        }
    });

    // 메시지 전송 및 알림 처리
    socket.on('send_message', async (data) => {
        const { receiverId, senderId, content, senderNickname, senderProfilePic } = data;
        try {
            // 1. 알림 DB 저장 (DM 알림)
            const newNoti = await prisma.notification.create({
                data: {
                    type: 'MESSAGE',
                    userId: receiverId,
                    creatorId: senderId,
                    isRead: false
                },
                include: {
                    creator: { select: { nickname: true, profilePic: true } }
                }
            });

            // 2. 상대방에게 실시간 메시지 전송
            io.to(receiverId).emit('receive_message', {
                senderId,
                content,
                nickname: senderNickname,
                profilePic: senderProfilePic,
                createdAt: new Date()
            });

            // 3. 상대방에게 실시간 알림 이벤트 전송 (빨간 점 갱신용)
            io.to(receiverId).emit('new_notification', newNoti);

        } catch (err) {
            console.error("❌ 알림/메시지 처리 에러:", err);
        }
    });

    socket.on('disconnect', () => {
        console.log('🔌 User disconnected');
    });
});

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