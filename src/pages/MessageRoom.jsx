import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import api from '../api/api';

const MessageRoom = () => {
    const { userId } = useParams(); // 상대방 ID
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const scrollRef = useRef();

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await api.get(`/api/messages/${userId}`);
                setMessages(response.data);
            } catch (err) { console.error("메시지 로드 실패"); }
        };
        fetchMessages();
        // 실제 실시간을 위해서는 여기서 socket.io 연결이 필요합니다.
    }, [userId]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        try {
            const response = await api.post(`/api/messages/${userId}`, { content: input });
            setMessages([...messages, response.data]);
            setInput('');
        } catch (err) { console.error("전송 실패"); }
    };

    return (
        <ChatContainer>
            <MsgList>
                {messages.map((msg, idx) => (
                    <MsgBubble key={idx} isMe={msg.sender === 'me'}>
                        <Text isMe={msg.sender === 'me'}>{msg.content}</Text>
                    </MsgBubble>
                ))}
                <div ref={scrollRef} />
            </MsgList>
            <InputArea>
                <ChatInput
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="메시지를 입력하세요..."
                />
                <SendBtn onClick={handleSend}>전송</SendBtn>
            </InputArea>
        </ChatContainer>
    );
};

export default MessageRoom;

const ChatContainer = styled.div` display: flex; flex-direction: column; height: calc(100vh - 140px); `;
const MsgList = styled.div` flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 10px; `;
const MsgBubble = styled.div` display: flex; justify-content: ${props => props.isMe ? 'flex-end' : 'flex-start'}; `;
const Text = styled.div` background: ${props => props.isMe ? '#74b9ff' : 'white'}; color: ${props => props.isMe ? 'white' : '#333'}; padding: 10px 15px; border-radius: 20px; max-width: 70%; box-shadow: 0 2px 10px rgba(0,0,0,0.05); `;
const InputArea = styled.div` padding: 20px; background: white; display: flex; gap: 10px; `;
const ChatInput = styled.input` flex: 1; padding: 12px; border-radius: 20px; border: 1px solid #eee; outline: none; `;
const SendBtn = styled.button` background: #74b9ff; color: white; border: none; padding: 0 20px; border-radius: 20px; cursor: pointer; `;