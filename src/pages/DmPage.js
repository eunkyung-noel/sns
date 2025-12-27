import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import api from '../api/api';
import Swal from 'sweetalert2';

const MessageBubbleWidget = ({ partnerId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [partnerName, setPartnerName] = useState('User');
    const scrollRef = useRef();

    const storedUserId = localStorage.getItem('userId');
    const myId = storedUserId ? String(storedUserId) : '';

    // 데이터 로드
    const fetchData = async () => {
        if (!partnerId || !isOpen) return;
        try {
            const res = await api.get(`/api/dm/${partnerId}`);
            const data = res.data || [];
            setMessages(data);

            if (data.length > 0) {
                const sample = data[0];
                const isPartnerSender = String(sample.senderId) === String(partnerId);
                const name = isPartnerSender
                    ? (sample.sender?.nickname || sample.sender?.name)
                    : (sample.receiver?.nickname || sample.receiver?.name);
                if (name) setPartnerName(name);
            }
        } catch (err) {
            console.error("데이터 로드 실패:", err);
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
        if (!newMessage.trim()) return;

        try {
            await api.post(`/api/dm`, {
                receiverId: partnerId,
                content: newMessage.trim()
            });
            setNewMessage('');
            fetchData();
        } catch (err) {
            Swal.fire({ icon: 'error', title: '실패', text: '전송 오류' });
        }
    };

    return (
        <WidgetContainer>
            {/* 이모지 버튼 (클릭 시 토글) */}
            <ToggleButton onClick={() => setIsOpen(!isOpen)} $isOpen={isOpen}>
                {isOpen ? '✕' : '🫧'}
            </ToggleButton>

            {/* 팝업 채팅창 */}
            {isOpen && (
                <PopupContainer>
                    <Header>
                        <StatusDot />
                        <Title>{partnerName}님과 대화</Title>
                    </Header>

                    <MessageArea>
                        {messages.length === 0 ? (
                            <EmptyMsg>대화를 시작해보세요!</EmptyMsg>
                        ) : (
                            messages.map((msg, idx) => (
                                <BubbleWrapper key={idx} $isMe={String(msg.senderId) === myId}>
                                    <Bubble $isMe={String(msg.senderId) === myId}>
                                        {msg.content}
                                    </Bubble>
                                </BubbleWrapper>
                            ))
                        )}
                        <div ref={scrollRef} />
                    </MessageArea>

                    <InputBox onSubmit={handleSend}>
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="입력..."
                        />
                        <SendIcon type="submit">▲</SendIcon>
                    </InputBox>
                </PopupContainer>
            )}
        </WidgetContainer>
    );
};

export default MessageBubbleWidget;

/* --- 스타일 정의 --- */
const WidgetContainer = styled.div`
    position: fixed; bottom: 30px; right: 30px; z-index: 9999;
`;

const ToggleButton = styled.div`
    width: 60px; height: 60px;
    background: ${props => props.$isOpen ? '#ff7675' : 'linear-gradient(135deg, #74b9ff, #0984e3)'};
    border-radius: 50%; display: flex; justify-content: center; align-items: center;
    color: white; font-size: 24px; cursor: pointer;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    transition: all 0.3s ease;
    &:hover { transform: scale(1.1); }
`;

const PopupContainer = styled.div`
    position: absolute; bottom: 80px; right: 0; width: 300px; height: 400px;
    background: white; border-radius: 25px; display: flex; flex-direction: column;
    box-shadow: 0 15px 40px rgba(0,0,0,0.2); overflow: hidden;
    border: 1px solid rgba(116, 185, 255, 0.3);
`;

const Header = styled.div`
    padding: 15px; background: #f8fbff; border-bottom: 1px solid #eee;
    display: flex; align-items: center; gap: 10px;
`;

const StatusDot = styled.div` width: 8px; height: 8px; background: #00BFFF; border-radius: 50%; `;
const Title = styled.span` font-size: 14px; font-weight: bold; color: #1a2a6c; `;

const MessageArea = styled.div`
    flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;
    background: #fff;
`;

const EmptyMsg = styled.div` text-align: center; color: #ccc; font-size: 12px; margin-top: 50%; `;

const BubbleWrapper = styled.div`
    display: flex; justify-content: ${props => props.$isMe ? 'flex-end' : 'flex-start'};
`;

const Bubble = styled.div`
    max-width: 80%; padding: 10px 14px; border-radius: 15px; font-size: 13px;
    background: ${props => props.$isMe ? '#74b9ff' : '#f1f1f1'};
    color: ${props => props.$isMe ? 'white' : '#333'};
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
`;

const InputBox = styled.form`
    padding: 10px; display: flex; gap: 5px; border-top: 1px solid #eee; background: white;
`;

const Input = styled.input`
    flex: 1; padding: 10px 15px; border-radius: 20px; border: 1px solid #eee;
    outline: none; font-size: 13px;
`;

const SendIcon = styled.button`
    background: #74b9ff; color: white; border: none; width: 35px; height: 35px;
    border-radius: 50%; cursor: pointer; font-weight: bold;
`;