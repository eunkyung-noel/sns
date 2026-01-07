import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import api from '../api/api';

const MessageBubbleWidget = ({ partnerId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [partner, setPartner] = useState({ nickname: 'User', age: 0 });
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef();

    const myId = String(localStorage.getItem('userId') || '');

    // 1. 대화 내역 로드 (백엔드 라우터 :userId 에 맞춤)
    const fetchData = async () => {
        if (!partnerId || !isOpen) return;
        try {
            // [수정] /detail 제거 -> 백엔드의 router.get('/:userId')와 일치시킴
            const res = await api.get(`/api/dm/${partnerId}`);
            const data = res.data || [];

            if (JSON.stringify(messages) !== JSON.stringify(data)) {
                setMessages(data);
            }

            if (partner.nickname === 'User') {
                const userRes = await api.get(`/users/${partnerId}`);
                if (userRes.data?.user) {
                    setPartner({ nickname: userRes.data.user.nickname, age: userRes.data.user.age });
                }
            }
        } catch (err) {
            console.error("404 에러 발생 시 이 경로를 확인하세요: /api/dm/" + partnerId);
        }
    };

    useEffect(() => {
        fetchData();
        let interval;
        if (isOpen) {
            interval = setInterval(fetchData, 3000);
        }
        return () => clearInterval(interval);
    }, [partnerId, isOpen]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 2. 메시지 전송 (중복 방지 및 경로 수정)
    const handleSend = async (e) => {
        e.preventDefault();
        const trimmedMsg = newMessage.trim();
        if (!trimmedMsg || !partnerId || isSending) return;

        setIsSending(true);
        try {
            // [수정] /detail 제거 -> 백엔드의 router.post('/:userId')와 일치시킴
            const res = await api.post(`/api/dm/${partnerId}`, { content: trimmedMsg });
            setNewMessage('');
            setMessages(prev => [...prev, res.data]);
        } catch (err) {
            console.error("전송 실패");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <WidgetContainer>
            <ToggleButton onClick={() => setIsOpen(!isOpen)} $isOpen={isOpen}>
                {isOpen ? '✕' : '🫧'}
            </ToggleButton>

            {isOpen && (
                <PopupContainer>
                    <Header>
                        <StatusDot />
                        <Title>
                            @{partner.nickname}
                            <AgeIcon>{partner.age >= 19 ? '🐳' : '🐠'}</AgeIcon>
                        </Title>
                    </Header>

                    <MessageArea>
                        {messages.length === 0 ? (
                            <EmptyMsg>🫧 대화를 시작해보세요!</EmptyMsg>
                        ) : (
                            messages.map((msg) => (
                                <BubbleWrapper key={msg.id || Math.random()} $isMe={String(msg.senderId) === myId}>
                                    <BubbleBox $isMe={String(msg.senderId) === myId}>
                                        {String(msg.senderId) === myId && (
                                            <ReadStatus>{msg.isRead ? '' : '1'}</ReadStatus>
                                        )}
                                        <Bubble $isMe={String(msg.senderId) === myId}>
                                            {msg.content}
                                        </Bubble>
                                    </BubbleBox>
                                </BubbleWrapper>
                            ))
                        )}
                        <div ref={scrollRef} />
                    </MessageArea>

                    <InputBox onSubmit={handleSend}>
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="메시지 입력..."
                            disabled={isSending}
                        />
                        <SendIcon type="submit" disabled={isSending}>▲</SendIcon>
                    </InputBox>
                </PopupContainer>
            )}
        </WidgetContainer>
    );
};

export default MessageBubbleWidget;

/* 스타일 (이전과 동일) */
const AgeIcon = styled.span` margin-left: 5px; font-size: 16px; `;
const WidgetContainer = styled.div` position: fixed; bottom: 30px; right: 30px; z-index: 9999; `;
const ToggleButton = styled.div` width: 60px; height: 60px; background: ${props => props.$isOpen ? '#ff7675' : 'linear-gradient(135deg, #74b9ff, #0984e3)'}; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: white; font-size: 24px; cursor: pointer; box-shadow: 0 10px 25px rgba(0,0,0,0.1); `;
const PopupContainer = styled.div` position: absolute; bottom: 80px; right: 0; width: 300px; height: 400px; background: white; border-radius: 25px; display: flex; flex-direction: column; box-shadow: 0 15px 40px rgba(0,0,0,0.2); border: 1px solid rgba(116, 185, 255, 0.3); overflow: hidden; `;
const Header = styled.div` padding: 15px; background: #f8fbff; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 10px; `;
const StatusDot = styled.div` width: 8px; height: 8px; background: #00BFFF; border-radius: 50%; `;
const Title = styled.span` font-size: 14px; font-weight: bold; color: #1a2a6c; display: flex; align-items: center; `;
const MessageArea = styled.div` flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; background: #fff; `;
const EmptyMsg = styled.div` text-align: center; color: #ccc; font-size: 12px; margin-top: 50%; `;
const BubbleWrapper = styled.div` display: flex; justify-content: ${props => props.$isMe ? 'flex-end' : 'flex-start'}; `;
const BubbleBox = styled.div` display: flex; align-items: flex-end; gap: 5px; flex-direction: ${props => props.$isMe ? 'row' : 'row-reverse'}; `;
const ReadStatus = styled.span` font-size: 10px; color: #ffeb33; font-weight: bold; margin-bottom: 2px; `;
const Bubble = styled.div` padding: 10px 14px; border-radius: 15px; font-size: 13px; background: ${props => props.$isMe ? '#74b9ff' : '#f1f1f1'}; color: ${props => props.$isMe ? 'white' : '#333'}; word-break: break-all; `;
const InputBox = styled.form` padding: 10px; display: flex; gap: 5px; border-top: 1px solid #eee; `;
const Input = styled.input` flex: 1; padding: 10px 15px; border-radius: 20px; border: 1px solid #eee; outline: none; font-size: 13px; `;
const SendIcon = styled.button` background: #74b9ff; color: white; border: none; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; display: flex; justify-content: center; align-items: center; opacity: ${props => props.disabled ? 0.5 : 1}; `;