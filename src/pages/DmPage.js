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

    const fetchData = async () => {
        if (!partnerId || !isOpen) return;
        try {
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
            console.error("데이터 로드 실패: /api/dm/" + partnerId);
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

    const handleSend = async (e) => {
        e.preventDefault();
        const trimmedMsg = newMessage.trim();
        if (!trimmedMsg || !partnerId || isSending) return;

        setIsSending(true);
        try {
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

/* --- 스타일: 기존 톤 유지 및 사이즈 스케일 업 --- */

const WidgetContainer = styled.div` 
    position: fixed; 
    bottom: 40px;     /* 🔍 하단 여백 확대 (30px -> 40px) */
    right: 40px;      /* 🔍 우측 여백 확대 (30px -> 40px) */
    z-index: 9999; 
`;

const ToggleButton = styled.div` 
    width: 70px;      /* 🔍 버튼 크기 확대 (60px -> 70px) */
    height: 70px; 
    background: ${props => props.$isOpen ? '#ff7675' : 'linear-gradient(135deg, #74b9ff, #0984e3)'}; 
    border-radius: 50%; 
    display: flex; 
    justify-content: center; 
    align-items: center; 
    color: white; 
    font-size: 32px;  /* 🔍 아이콘 크기 확대 */
    cursor: pointer; 
    box-shadow: 0 12px 30px rgba(0,0,0,0.15); 
    transition: transform 0.2s;
    &:hover { transform: scale(1.1); }
`;

const PopupContainer = styled.div` 
    position: absolute; 
    bottom: 90px;     /* 🔍 팝업 위치 조정 */
    right: 0; 
    width: 380px;     /* 🔍 팝업 너비 확대 (300px -> 380px) */
    height: 550px;    /* 🔍 팝업 높이 확대 (400px -> 550px) */
    background: white; 
    border-radius: 30px; 
    display: flex; 
    flex-direction: column; 
    box-shadow: 0 20px 50px rgba(0,0,0,0.25); 
    border: 1px solid rgba(116, 185, 255, 0.3); 
    overflow: hidden; 
`;

const Header = styled.div` 
    padding: 20px;    /* 🔍 헤더 패딩 확대 */
    background: #f8fbff; 
    border-bottom: 1px solid #eee; 
    display: flex; 
    align-items: center; 
    gap: 12px; 
`;

const Title = styled.span` 
    font-size: 17px;  /* 🔍 닉네임 폰트 확대 */
    font-weight: bold; 
    color: #1a2a6c; 
    display: flex; 
    align-items: center; 
`;

const AgeIcon = styled.span` margin-left: 8px; font-size: 18px; `;

const MessageArea = styled.div` 
    flex: 1; 
    padding: 20px;    /* 🔍 메시지 영역 패딩 확대 */
    overflow-y: auto; 
    display: flex; 
    flex-direction: column; 
    gap: 16px;        /* 🔍 말풍선 간격 확대 */
    background: #fff; 
`;

const BubbleWrapper = styled.div` display: flex; justify-content: ${props => props.$isMe ? 'flex-end' : 'flex-start'}; `;
const BubbleBox = styled.div` display: flex; align-items: flex-end; gap: 8px; flex-direction: ${props => props.$isMe ? 'row' : 'row-reverse'}; `;
const ReadStatus = styled.span` font-size: 11px; color: #ffeb33; font-weight: bold; margin-bottom: 2px; `;

const Bubble = styled.div` 
    padding: 12px 18px; /* 🔍 말풍선 내부 여백 확대 */
    border-radius: 20px; 
    font-size: 15px;    /* 🔍 말풍선 폰트 확대 (13px -> 15px) */
    background: ${props => props.$isMe ? '#74b9ff' : '#f1f1f1'}; 
    color: ${props => props.$isMe ? 'white' : '#333'}; 
    word-break: break-all; 
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
`;

const InputBox = styled.form` 
    padding: 15px 20px; /* 🔍 입력창 하단 패딩 확대 */
    display: flex; 
    gap: 10px; 
    border-top: 1px solid #eee; 
`;

const Input = styled.input` 
    flex: 1; 
    padding: 12px 20px; 
    border-radius: 25px; 
    border: 1px solid #eee; 
    outline: none; 
    font-size: 15px;    /* 🔍 입력창 폰트 확대 */
`;

const SendIcon = styled.button` 
    background: #74b9ff; 
    color: white; 
    border: none; 
    width: 45px;       /* 🔍 전송 버튼 크기 확대 (35px -> 45px) */
    height: 45px; 
    border-radius: 50%; 
    cursor: pointer; 
    display: flex; 
    justify-content: center; 
    align-items: center; 
    font-size: 16px;
    opacity: ${props => props.disabled ? 0.5 : 1}; 
    transition: background 0.2s;
    &:hover { background: #0984e3; }
`;

const EmptyMsg = styled.div` text-align: center; color: #ccc; font-size: 14px; margin-top: 50%; `;
const StatusDot = styled.div` width: 10px; height: 10px; background: #00BFFF; border-radius: 50%; `;