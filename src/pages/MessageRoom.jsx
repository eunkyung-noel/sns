import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../api/api';
import Swal from 'sweetalert2';

const MessageRoom = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const scrollRef = useRef();

    // 🔍 내 ID 확인 (비교를 위해 문자열 변환)
    const myId = String(localStorage.getItem('userId') || '');

    // 🔍 시간 포맷 (오전/오후 HH:mm)
    const formatTime = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";
        return date.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const fetchMessages = async () => {
        if (!userId) return;
        try {
            const response = await api.get(`/api/dm/${userId}`);
            // 🔍 데이터 구조 확인용 로그
            console.log("수신 데이터:", response.data);
            setMessages(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("메시지 로드 실패");
        }
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [userId]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        try {
            const response = await api.post(`/api/dm/${userId}`, { content: input });
            setMessages(prev => [...prev, response.data]);
            setInput('');
        } catch (err) { console.error("전송 실패"); }
    };

    const handleDeleteMessage = async (messageId) => {
        const result = await Swal.fire({
            title: '삭제하시겠습니까?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff7675',
            confirmButtonText: '삭제'
        });
        if (result.isConfirmed) {
            try {
                await api.delete(`/api/dm/message/${messageId}`);
                setMessages(prev => prev.filter(m => String(m.id || m._id) !== String(messageId)));
            } catch (err) { fetchMessages(); }
        }
    };

    const handleEditMessage = async (messageId, currentContent) => {
        const { value: text } = await Swal.fire({
            title: '메시지 수정',
            input: 'textarea',
            inputValue: currentContent,
            showCancelButton: true,
            confirmButtonColor: '#1a2a6c',
            confirmButtonText: '수정'
        });
        if (text && text !== currentContent) {
            try {
                await api.put(`/api/dm/message/${messageId}`, { content: text });
                setMessages(prev => prev.map(m => String(m.id || m._id) === String(messageId) ? { ...m, content: text } : m));
            } catch (err) { fetchMessages(); }
        }
    };

    return (
        <FullPage>
            <ChatHeader>
                <div className="left">
                    <span className="back" onClick={() => navigate(-1)}>〈</span>
                    <span className="username">Chat</span>
                    <IconBadge>🐳</IconBadge>
                </div>
                <div className="close" onClick={() => navigate('/dm')}>✕</div>
            </ChatHeader>

            <MsgList>
                {messages.length > 0 ? messages.map((msg, idx) => {
                    // 🔍 필드명 불일치 방어 (ID, Sender, Time)
                    const mId = msg.id || msg._id;
                    const sId = msg.senderId || msg.sender_id || (msg.sender && (msg.sender.id || msg.sender._id));
                    const isMe = String(sId) === myId;
                    const time = msg.createdAt || msg.created_at || msg.timestamp;

                    return (
                        <MsgBubble key={mId || idx} $isMe={isMe}>
                            <BubbleContainer $isMe={isMe}>
                                <ContentRow $isMe={isMe}>
                                    <Text $isMe={isMe}>{msg.content}</Text>
                                    <TimeStamp>{formatTime(time)}</TimeStamp>
                                </ContentRow>

                                {isMe && mId && (
                                    <ActionRow>
                                        <ActionBtn onClick={() => handleEditMessage(mId, msg.content)}>✏️</ActionBtn>
                                        <ActionBtn onClick={() => handleDeleteMessage(mId)}>🗑️</ActionBtn>
                                    </ActionRow>
                                )}
                            </BubbleContainer>
                        </MsgBubble>
                    );
                }) : <EmptyText>대화 내역이 없습니다. 🫧</EmptyText>}
                <div ref={scrollRef} />
            </MsgList>

            <InputSection>
                <InputWrapper>
                    <ChatInput
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="메시지를 입력하세요..."
                    />
                    <SendBtn onClick={handleSend} disabled={!input.trim()}>전송</SendBtn>
                </InputWrapper>
            </InputSection>
        </FullPage>
    );
};

export default MessageRoom;

/* --- 스타일 (가시성 최우선) --- */

const FullPage = styled.div` display: flex; flex-direction: column; width: 100vw; height: calc(100vh - 80px); background: #f0f2f5; position: fixed; top: 80px; left: 0; z-index: 100; `;
const ChatHeader = styled.div` background: #1a2a6c; color: white; padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); .left { display: flex; align-items: center; gap: 12px; } .back { cursor: pointer; font-size: 22px; } .username { font-size: 18px; font-weight: 800; } .close { cursor: pointer; font-size: 20px; } `;
const IconBadge = styled.div` width: 24px; height: 24px; background: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 14px; `;
const MsgList = styled.div` flex: 1; overflow-y: auto; padding: 20px 5%; display: flex; flex-direction: column; gap: 20px; `;
const MsgBubble = styled.div` display: flex; justify-content: ${props => props.$isMe ? 'flex-end' : 'flex-start'}; `;
const BubbleContainer = styled.div` display: flex; flex-direction: column; align-items: ${props => props.$isMe ? 'flex-end' : 'flex-start'}; gap: 5px; max-width: 80%; `;
const ContentRow = styled.div` display: flex; align-items: flex-end; gap: 8px; flex-direction: ${props => props.$isMe ? 'row-reverse' : 'row'}; `;
const Text = styled.div` background: ${props => props.$isMe ? '#1a2a6c' : 'white'}; color: ${props => props.$isMe ? 'white' : '#333'}; padding: 12px 16px; border-radius: 18px; font-size: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); word-break: break-all; `;
const TimeStamp = styled.span` font-size: 11px; color: #666; white-space: nowrap; margin-bottom: 2px; `;
const ActionRow = styled.div` display: flex; gap: 12px; padding: 0 5px; margin-top: 2px; `;
const ActionBtn = styled.span` font-size: 14px; cursor: pointer; color: #888; transition: 0.2s; &:hover { color: #000; transform: scale(1.1); } `;
const InputSection = styled.div` background: white; padding: 15px 5%; border-top: 1px solid #e2e8f0; `;
const InputWrapper = styled.div` display: flex; background: #f8fafc; border-radius: 30px; padding: 5px 5px 5px 20px; border: 1px solid #e1e8f0; align-items: center; `;
const ChatInput = styled.input` flex: 1; border: none; background: transparent; padding: 10px 0; outline: none; font-size: 15px; `;
const SendBtn = styled.button` background: ${props => props.disabled ? '#cbd5e0' : '#1a2a6c'}; color: white; border: none; padding: 10px 25px; border-radius: 25px; cursor: pointer; font-weight: bold; `;
const EmptyText = styled.div` text-align: center; color: #999; margin-top: 50px; `;