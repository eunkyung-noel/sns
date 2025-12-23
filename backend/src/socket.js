const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

// 연결된 유저들의 소켓 ID를 저장하는 맵 (key: userId, value: socketId)
const connectedUsers = new Map();

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`[Socket Connected] ID: ${socket.id}`);

        // 1. 인증: 클라이언트가 연결되면 토큰을 받아 userId를 확인하고 소켓을 등록합니다.
        socket.on('authenticate', (token) => {
            try {
                // 토큰 검증
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const userId = decoded.userId;

                // 유저-소켓 매핑 등록
                connectedUsers.set(userId, socket.id);
                socket.userId = userId; // 소켓 객체에 userId 저장 (편의상)

                console.log(`User ${userId} authenticated and connected.`);
                io.emit('onlineUsers', Array.from(connectedUsers.keys())); // 모든 클라이언트에게 온라인 유저 목록 업데이트

            } catch (error) {
                console.log(`Socket authentication failed: ${error.message}`);
                socket.disconnect(true); // 인증 실패 시 연결 끊기
            }
        });

        // 2. 실시간 메시지 수신 및 전송
        socket.on('sendDm', async ({ receiverId, content }) => {
            const senderId = socket.userId;
            const receiverSocketId = connectedUsers.get(receiverId);

            if (!senderId) return; // 인증되지 않은 사용자라면 무시

            try {
                //  기존 REST API 로직의 DM 제한 검사 및 DB 저장 로직을 여기서 실행해야 합니다.
                // (이 예시에서는 검사 로직은 생략하고, DB 저장만 간소화합니다.
                // 복잡한 제한 로직은 기존 REST API의 POST /dm/send 로직을 참고해야 합니다.)

                // 1. DB에 메시지 저장
                const newMessage = await prisma.directMessage.create({
                    data: {
                        senderId,
                        receiverId,
                        content,
                    },
                    include: { sender: { select: { id: true, name: true } } }
                });

                // 2. 수신자에게 실시간 메시지 전송
                if (receiverSocketId) {
                    // 수신자가 온라인 상태일 경우
                    io.to(receiverSocketId).emit('receiveDm', newMessage);
                } else {
                    // 수신자가 오프라인일 경우: '새 메시지 알림' DB 로직이나 푸시 알림 로직이 필요
                    console.log(`User ${receiverId} is offline. Message saved.`);
                }

                // 3. 발신자에게도 성공적으로 보냈음을 알림
                socket.emit('dmSentSuccess', newMessage);

            } catch (error) {
                console.error('Real-time DM sending error:', error);
                socket.emit('dmError', '메시지 전송 중 서버 오류가 발생했습니다.');
            }
        });

        // 3. 연결 해제
        socket.on('disconnect', () => {
            if (socket.userId) {
                connectedUsers.delete(socket.userId);
                console.log(`User ${socket.userId} disconnected.`);
                io.emit('onlineUsers', Array.from(connectedUsers.keys())); // 모든 클라이언트에게 온라인 유저 목록 업데이트
            }
            console.log(`[Socket Disconnected] ID: ${socket.id}`);
        });
    });
};