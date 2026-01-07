const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

// 유저별 소켓 목록 관리 (중복 로그인 대응)
const userSockets = new Map();

module.exports = (io) => {
    // 1. 연결 전 인증 미들웨어 (보안 강화)
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        if (!token) return next(new Error('Authentication error: No token provided'));

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.userId;
        console.log(`[Connected] User: ${userId}, Socket: ${socket.id}`);

        // 유저 소켓 목록에 추가
        if (!userSockets.has(userId)) userSockets.set(userId, new Set());
        userSockets.get(userId).add(socket.id);

        // 온라인 유저 목록 브로드캐스트
        io.emit('onlineUsers', Array.from(userSockets.keys()));

        // 2. 메시지 전송 로직
        socket.on('sendDm', async ({ receiverId, content }) => {
            if (!content || !receiverId) return;
            if (userId === receiverId) return socket.emit('dmError', '자기 자신에게는 보낼 수 없습니다.');

            try {
                // DB 저장
                const newMessage = await prisma.directMessage.create({
                    data: {
                        senderId: userId,
                        receiverId: receiverId,
                        content: content,
                    },
                    include: {
                        sender: { select: { id: true, name: true } }
                    }
                });

                // 수신자의 모든 소켓에 메시지 전송 (중복 로그인 대응)
                const receiverSocketIds = userSockets.get(receiverId);
                if (receiverSocketIds) {
                    receiverSocketIds.forEach(id => {
                        io.to(id).emit('receiveDm', newMessage);
                    });
                }

                // 발신자의 다른 기기(소켓)들에도 동기화
                userSockets.get(userId).forEach(id => {
                    io.to(id).emit('dmSentSuccess', newMessage);
                });

            } catch (error) {
                console.error('DM Error:', error);
                socket.emit('dmError', '메시지 저장 중 오류가 발생했습니다.');
            }
        });

        // 3. 연결 해제 처리
        socket.on('disconnect', () => {
            const sockets = userSockets.get(userId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    userSockets.delete(userId);
                    io.emit('onlineUsers', Array.from(userSockets.keys()));
                }
            }
            console.log(`[Disconnected] User: ${userId}`);
        });
    });
};