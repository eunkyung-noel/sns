import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/api';

const ChatRoomPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [partnerName, setPartnerName] = useState('대화 상대');
    const socketRef = useRef(null);
    const scrollRef = useRef(null);

    const getMyId = () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return 'temp_user_id'; // 토큰 없을 때 임시 ID
            return JSON.parse(atob(token.split('.')[1])).userId;
        } catch (e) { return 'temp_user_id'; }
    };
    const myId = getMyId();

    useEffect(() => {
        const initChat = async () => {
            try {
                const res = await api.get(`/dm/detail/${roomId}`);
                setPartnerName(res.data.partnerName || '상대방');
                setMessages(res.data.messages.map(m => ({
                    ...m,
                    isMe: String(m.senderId) === String(myId)
                })));
            } catch (err) {
                console.warn("기록 로드 실패: 서버가 없으므로 테스트 데이터를 사용합니다.");
                setPartnerName("테스트 상대방");
                setMessages([
                    { content: "서버 연결 전 테스트 메시지입니다.", senderId: "system", isMe: false },
                    { content: "메시지를 입력하면 화면에 즉시 반영됩니다.", senderId: "system", isMe: false }
                ]);
            }
        };
        initChat();

        // 소켓 연결 시도 (실패 시에도 앱이 멈추지 않음)
        socketRef.current = io("http://localhost:5001", {
            auth: { token: localStorage.getItem('token') || 'test-token' },
            transports: ['websocket'],
            reconnection: false
        });

        socketRef.current.on('receiveDm', (newMsg) => {
            setMessages(prev => [...prev, {
                ...newMsg,
                isMe: String(newMsg.senderId) === String(myId)
            }]);
        });

        return () => socketRef.current?.disconnect();
    }, [roomId, myId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!message.trim()) return;

        const newMsg = {
            content: message,
            senderId: myId,
            isMe: true,
            createdAt: new Date().toISOString(),
            isRead: false
        };

        // 서버 연결 여부와 관계없이 화면(State)에 즉시 추가
        setMessages(prev => [...prev, newMsg]);

        if (socketRef.current?.connected) {
            socketRef.current.emit('sendDm', { senderId: myId, receiverId: roomId, content: message });
        } else {
            console.log("서버 미연결: UI에만 반영되었습니다.");
        }

        setMessage('');
    };

    return (
        <Container>
            <Header>
                <Back onClick={() => navigate('/dm')}>⬅️</Back>
                <Title>{partnerName}님과의 대화</Title>
            </Header>
            <List ref={scrollRef}>
                {messages.map((msg, i) => (
                    <Row key={i} $isMe={msg.isMe}>
                        {msg.isMe && msg.isRead === false && <Unread>1</Unread>}
                        <Bubble $isMe={msg.isMe}>{msg.content}</Bubble>
                    </Row>
                ))}
            </List>
            <InputRow>
                <Input
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                    placeholder="메시지 입력..."
                />
                <SendBtn onClick={handleSend}>🫧</SendBtn>
            </InputRow>
        </Container>
    );
};

export default ChatRoomPage;

// 스타일 정의 (사용자 코드와 동일)
const Container = styled.div` display: flex; flex-direction: column; height: 100vh; max-width: 500px; margin: auto; background: #f8f9fa; `;
const Header = styled.div` display: flex; align-items: center; padding: 15px; background: white; border-bottom: 1px solid #eee; `;
const Back = styled.span` cursor: pointer; font-size: 20px; margin-right: 15px; `;
const Title = styled.span` font-weight: bold; `;
const List = styled.div` flex: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; gap: 10px; `;
const Row = styled.div` display: flex; align-items: flex-end; gap: 5px; justify-content: ${p => p.$isMe ? 'flex-end' : 'flex-start'}; `;
const Unread = styled.span` color: #000080; font-size: 11px; font-weight: bold; margin-bottom: 2px; `;
const Bubble = styled.div` max-width: 75%; padding: 10px 14px; border-radius: 18px; font-size: 14px; background: ${p => p.$isMe ? '#74b9ff' : 'white'}; color: ${p => p.$isMe ? 'white' : '#333'}; box-shadow: 0 1px 2px rgba(0,0,0,0.1); `;
const InputRow = styled.div` display: flex; padding: 15px; background: white; border-top: 1px solid #eee; `;
const Input = styled.input` flex: 1; border: none; background: #f1f2f6; padding: 12px; border-radius: 20px; outline: none; `;
const SendBtn = styled.button` border: none; background: none; font-size: 24px; margin-left: 10px; cursor: pointer; `;