import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/api';

const ChatRoomPage = () => {
    const { roomId } = useParams(); // 상대방 ID
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [partnerName, setPartnerName] = useState('대화 상대');
    const [isSending, setIsSending] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const socketRef = useRef(null);
    const scrollRef = useRef(null);

    const myId = localStorage.getItem('userId');

    useEffect(() => {
        if (!roomId) return;

        const initChat = async () => {
            try {
                // 1. 메시지 내역 로드
                const res = await api.get(`/dm/${roomId}`);
                setMessages(res.data.map(m => ({
                    ...m,
                    isMe: String(m.senderId) === String(myId)
                })));

                // 2. 상대방 정보 로드 (이름 표시용)
                // 별도의 유저 프로필 API가 있다면 호출, 없으면 첫 메시지에서 추출
                if (res.data.length > 0) {
                    const partner = res.data.find(m => String(m.senderId) === String(roomId));
                    if (partner?.sender?.nickname) setPartnerName(partner.sender.nickname);
                }
            } catch (err) {
                console.error("데이터 로드 실패");
            }
        };

        initChat();

        // Socket.io 연결 (이벤트명: receive_message로 서버와 일치)
        socketRef.current = io("http://localhost:5001", {
            transports: ['websocket']
        });

        socketRef.current.emit('join', myId);

        socketRef.current.on('receive_message', (newMsg) => {
            // 현재 보고 있는 방의 상대방이 보낸 메시지만 추가
            if (String(newMsg.senderId) === String(roomId)) {
                setMessages(prev => [...prev, { ...newMsg, isMe: false }]);
            }
        });

        return () => socketRef.current?.disconnect();
    }, [roomId, myId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        const trimmed = message.trim();
        if (!trimmed || !roomId || isSending) return;

        setIsSending(true);
        setErrorMsg('');

        try {
            // 백엔드 라우터: POST /api/dm/:userId
            const res = await api.post(`/dm/${roomId}`, { content: trimmed });

            if (res.status === 201 || res.status === 200) {
                const newMsgData = { ...res.data, isMe: true };
                setMessages(prev => [...prev, newMsgData]);

                // 실시간 전송 (이벤트명: send_message로 서버와 일치)
                if (socketRef.current?.connected) {
                    socketRef.current.emit('send_message', {
                        senderId: myId,
                        receiverId: roomId,
                        content: trimmed
                    });
                }
                setMessage('');
            }
        } catch (err) {
            if (err.response?.status === 403) {
                setErrorMsg(err.response.data.message); // 성인-미성년자 조건 에러 메시지 표시
                setTimeout(() => setErrorMsg(''), 7000);
            } else {
                console.error("전송 실패", err);
            }
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Container>
            <Header>
                <HeaderLeft onClick={() => navigate('/dm')}>
                    <Back>{"<"}</Back>
                    <Title>@{partnerName}</Title>
                </HeaderLeft>
                <HeaderRight>
                    <IconBtn onClick={() => navigate('/dm')}>✕</IconBtn>
                </HeaderRight>
            </Header>

            {errorMsg && (
                <ErrorBanner>
                    <ErrorIcon>⚠️</ErrorIcon>
                    <span style={{flex: 1}}>{errorMsg}</span>
                    <CloseX onClick={() => setErrorMsg('')}>✕</CloseX>
                </ErrorBanner>
            )}

            <List ref={scrollRef}>
                {messages.length === 0 ? (
                    <EmptyMsg>🫧 첫 메시지를 보내보세요!</EmptyMsg>
                ) : (
                    messages.map((msg, i) => (
                        <Row key={msg.id || i} $isMe={msg.isMe}>
                            {msg.isMe && !msg.isRead && <Unread>1</Unread>}
                            <Bubble $isMe={msg.isMe}>{msg.content}</Bubble>
                        </Row>
                    ))
                )}
            </List>

            <InputWrapper>
                <InputRow onSubmit={handleSend}>
                    <Input
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder={isSending ? "전송 중..." : "메시지 입력..."}
                        disabled={isSending}
                    />
                    <SendBtn type="submit" disabled={isSending}>▲</SendBtn>
                </InputRow>
            </InputWrapper>
        </Container>
    );
};

export default ChatRoomPage;

/* CSS는 기존 코드와 동일하여 생략 (그대로 사용하시면 됩니다) */
const slideDown = keyframes`
    from { opacity: 0; transform: translate(-50%, -20px); }
    to { opacity: 1; transform: translate(-50%, 0); }
`;
const Container = styled.div` display: flex; flex-direction: column; height: 100vh; max-width: 500px; margin: auto; background-color: #f0f2f5; position: relative; overflow: hidden; `;
const Header = styled.div` display: flex; align-items: center; justify-content: space-between; padding: 15px 20px; background: #1a2a6c; color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 10; `;
const HeaderLeft = styled.div` display: flex; align-items: center; gap: 8px; cursor: pointer; `;
const HeaderRight = styled.div` display: flex; align-items: center; `;
const Back = styled.span` font-size: 18px; font-weight: bold; `;
const Title = styled.span` font-weight: 600; font-size: 15px; `;
const IconBtn = styled.span` font-size: 18px; cursor: pointer; `;
const ErrorBanner = styled.div` position: absolute; top: 75px; left: 50%; transform: translateX(-50%); width: 90%; background: #ff4757; color: white; padding: 12px 15px; border-radius: 12px; font-size: 13px; font-weight: 500; z-index: 100; animation: ${slideDown} 0.4s ease-out; box-shadow: 0 8px 20px rgba(255, 71, 87, 0.3); display: flex; align-items: center; gap: 10px; `;
const ErrorIcon = styled.span` font-size: 16px; `;
const CloseX = styled.span` margin-left: auto; cursor: pointer; padding: 2px 5px; opacity: 0.8; &:hover { opacity: 1; } `;
const List = styled.div` flex: 1; overflow-y: auto; padding: 20px 15px; display: flex; flex-direction: column; gap: 12px; `;
const EmptyMsg = styled.div` text-align: center; color: #999; margin-top: 50px; align-self: center; font-size: 13px; `;
const Row = styled.div` display: flex; align-items: flex-end; gap: 6px; justify-content: ${p => p.$isMe ? 'flex-end' : 'flex-start'}; `;
const Unread = styled.span` color: #1a2a6c; font-size: 10px; font-weight: 800; margin-bottom: 2px; `;
const Bubble = styled.div` max-width: 70%; padding: 10px 14px; border-radius: ${p => p.$isMe ? '15px 15px 2px 15px' : '15px 15px 15px 2px'}; font-size: 14px; background: ${p => p.$isMe ? '#1a2a6c' : 'white'}; color: ${p => p.$isMe ? 'white' : '#333'}; box-shadow: 0 1px 2px rgba(0,0,0,0.05); `;
const InputWrapper = styled.div` padding: 15px; background: white; border-top: 1px solid #eee; `;
const InputRow = styled.form` display: flex; align-items: center; background: #f1f2f6; padding: 5px 5px 5px 15px; border-radius: 25px; `;
const Input = styled.input` flex: 1; border: none; background: transparent; padding: 10px 0; outline: none; font-size: 14px; `;
const SendBtn = styled.button` border: none; background: #1a2a6c; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; `;