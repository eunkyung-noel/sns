const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// 🔍 수정된 경로: server.js와 models는 같은 src 폴더 안에 있으므로 ./models로 호출
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadPath = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath);
}
app.use('/uploads', express.static(uploadPath));

mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log('✅ MongoDB 연결 성공'))
    .catch(err => console.error('❌ MongoDB 연결 실패:', err));

const postRoutes = require('./routes/post.routes');
const authRoutes = require('./routes/auth.routes');
const dmRoutes = require('./routes/dm.routes');

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/dm', dmRoutes);

io.on('connection', (socket) => {
    console.log('📡 유저 접속:', socket.id);

    // 유저 개별 방 생성 (자신의 ID를 방 이름으로 사용)
    socket.on('joinSelf', (userId) => {
        socket.join(userId);
        console.log(`🔑 유저 ${userId}가 개인 소켓 방에 입장`);
    });

    socket.on('joinRoom', async ({ roomId, userId }) => {
        socket.join(roomId);
        console.log(`👤 유저 ${userId}가 방 ${roomId}에 입장함`);

        try {
            await Message.updateMany(
                { senderId: roomId, receiverId: userId, isRead: false },
                { $set: { isRead: true } }
            );
            // 상대방에게 내가 읽었음을 알림
            io.to(roomId).emit('messagesRead', { readerId: userId });
        } catch (err) {
            console.error("읽음 처리 에러:", err);
        }
    });

    socket.on('sendDm', async (data) => {
        const { receiverId, senderId, content } = data;

        try {
            // 1. DB에 영구 저장
            const newMessage = new Message({
                senderId,
                receiverId,
                content,
                isRead: false
            });
            await newMessage.save();

            // 2. 실시간 전송 (받는 사람과 보내는 사람 모두에게)
            io.to(receiverId).to(senderId).emit('receiveDm', {
                ...newMessage._doc,
                isMe: false // 프론트에서 senderId와 비교하여 처리함
            });
        } catch (err) {
            console.error("메시지 저장 에러:", err);
        }
    });

    socket.on('markAsRead', async ({ roomId, userId }) => {
        try {
            await Message.updateMany(
                { senderId: roomId, receiverId: userId, isRead: false },
                { $set: { isRead: true } }
            );
            io.to(roomId).emit('messagesRead', { readerId: userId });
        } catch (err) {
            console.error("markAsRead 에러:", err);
        }
    });

    socket.on('disconnect', () => {
        console.log('📡 유저 접속 해제');
    });
});

app.use((req, res) => {
    res.status(404).json({ message: "요청하신 경로를 찾을 수 없습니다." });
});

const PORT = 5001;
server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});