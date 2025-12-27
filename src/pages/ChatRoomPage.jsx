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

    const myId = JSON.parse(atob(localStorage.getItem('token').split('.')[1])).userId;

    useEffect(() => {
        const initChat = async () => {
            try {
                const res = await api.get(`/dm/detail/${roomId}`);
                setPartnerName(res.data.partnerName);
                setMessages(res.data.messages.map(m => ({
                    ...m,
                    isMe: m.senderId.toString() === myId.toString()
                })));
            } catch (err) { console.error("기록 로드 실패", err); }
        };
        initChat();

        socketRef.current = io("http://localhost:5001", { auth: { token: localStorage.getItem('token') } });
        socketRef.current.emit('joinRoom', { roomId, userId: myId });

        socketRef.current.on('receiveDm', (newMsg) => {
            if (newMsg.senderId === roomId || newMsg.senderId === myId) {
                setMessages(prev => [...prev, { ...newMsg, isMe: newMsg.senderId.toString() === myId.toString() }]);
            }
        });

        return () => socketRef.current?.disconnect();
    }, [roomId, myId]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const handleSend = () => {
        if (!message.trim()) return;
        socketRef.current.emit('sendDm', { senderId: myId, receiverId: roomId, content: message });
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
                        {msg.isMe && !msg.isRead && <Unread>1</Unread>}
                        <Bubble $isMe={msg.isMe}>{msg.content}</Bubble>
                    </Row>
                ))}
            </List>
            <InputRow>
                <Input value={message} onChange={e => setMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} placeholder="메시지 입력..." />
                <SendBtn onClick={handleSend}>🫧</SendBtn>
            </InputRow>
        </Container>
    );
};

export default ChatRoomPage;

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