import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/api';
import Swal from 'sweetalert2';

const ChatRoomPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [partnerName, setPartnerName] = useState('대화 상대');
    const [isSending, setIsSending] = useState(false);

    // --- [추가: 수정 기능을 위한 상태] ---
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');

    const socketRef = useRef(null);
    const scrollRef = useRef(null);

    const myId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    const formatTime = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? "" : date.toLocaleTimeString('ko-KR', {
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    };

    useEffect(() => {
        if (!roomId || !token) return;

        const initChat = async () => {
            try {
                const res = await api.get(`/dm/${roomId}`);
                setMessages(res.data.map(m => ({
                    ...m,
                    isMe: String(m.senderId) === String(myId)
                })));

                if (res.data.length > 0) {
                    const first = res.data[0];
                    const partner = String(first.senderId) === String(myId) ? first.receiver : first.sender;
                    if (partner?.nickname) setPartnerName(partner.nickname);
                }
                await api.put(`/dm/${roomId}/read`);
            } catch (err) {
                console.error("초기화 실패:", err);
            }
        };

        initChat();

        socketRef.current = io("http://localhost:5001", {
            transports: ['websocket'],
            auth: { token }
        });

        socketRef.current.on('receiveDm', (newMsg) => {
            if (String(newMsg.senderId) === String(roomId)) {
                setMessages(prev => [...prev, { ...newMsg, isMe: false }]);
            }
        });

        // --- [추가: 수정 소켓 수신] ---
        socketRef.current.on('message_updated', ({ messageId, content }) => {
            setMessages(prev => prev.map(m => (m.id || m._id) === messageId ? { ...m, content } : m));
        });

        socketRef.current.on('message_deleted', (deletedId) => {
            setMessages(prev => prev.filter(m => (m.id || m._id) !== deletedId));
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [roomId, myId, token]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        const trimmed = message.trim();
        if (!trimmed || isSending) return;

        setIsSending(true);
        try {
            const res = await api.post(`/dm/${roomId}`, { content: trimmed });
            const myNewMsg = { ...res.data, isMe: true, createdAt: new Date().toISOString(), isRead: false };
            setMessages(prev => [...prev, myNewMsg]);

            if (socketRef.current?.connected) {
                socketRef.current.emit('sendDm', { receiverId: roomId, content: trimmed });
            }
            setMessage('');
        } catch (err) {
            console.error("전송 실패", err);
        } finally {
            setIsSending(false);
        }
    };

    // --- [추가: 수정 요청 함수] ---
    const handleUpdate = async (msgId) => {
        if (!editContent.trim()) return;
        try {
            await api.put(`/dm/message/${msgId}`, { content: editContent });

            // 1. 내 상태 업데이트
            setMessages(prev => prev.map(m => (m.id || m._id) === msgId ? { ...m, content: editContent } : m));

            // 2. 소켓 브로드캐스트
            socketRef.current.emit('update_message', {
                messageId: msgId,
                content: editContent,
                receiverId: roomId
            });

            setEditingId(null);
        } catch (err) {
            Swal.fire('수정 실패', '메시지 수정 권한이 없습니다.', 'error');
        }
    };

    const handleDelete = async (msgId) => {
        const result = await Swal.fire({
            title: '메시지를 삭제하시겠습니까?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff4757',
            confirmButtonText: '삭제'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/dm/message/${msgId}`);
                socketRef.current.emit('delete_message', { messageId: msgId, receiverId: roomId });
                setMessages(prev => prev.filter(m => (m.id || m._id) !== msgId));
            } catch (err) {
                Swal.fire('삭제 실패', '본인의 메시지만 삭제할 수 있습니다.', 'error');
            }
        }
    };

    return (
        <Container>
            <Header>
                <HeaderLeft onClick={() => navigate('/dm')}>
                    <Back>{"<"}</Back>
                    <Title>@{partnerName}</Title>
                </HeaderLeft>
                <IconBtn onClick={() => navigate('/dm')}>✕</IconBtn>
            </Header>

            <List ref={scrollRef}>
                {messages.map((msg, i) => {
                    const mId = msg.id || msg._id;
                    const isEditing = editingId === mId;

                    return (
                        <Row key={mId || i} $isMe={msg.isMe}>
                            <BubbleContainer $isMe={msg.isMe}>
                                <ContentRow $isMe={msg.isMe}>
                                    {isEditing ? (
                                        <EditWrapper>
                                            <EditInput
                                                value={editContent}
                                                onChange={e => setEditContent(e.target.value)}
                                                autoFocus
                                            />
                                            <EditActions>
                                                <small onClick={() => handleUpdate(mId)}>저장</small>
                                                <small onClick={() => setEditingId(null)}>취소</small>
                                            </EditActions>
                                        </EditWrapper>
                                    ) : (
                                        <Bubble $isMe={msg.isMe}>{msg.content}</Bubble>
                                    )}
                                    <InfoGroup $isMe={msg.isMe}>
                                        {msg.isMe && !msg.isRead && <UnreadCount>1</UnreadCount>}
                                        <Time>{formatTime(msg.createdAt)}</Time>
                                    </InfoGroup>
                                </ContentRow>

                                {/* --- [수정: 내 메시지일 때 수정/삭제 버튼 표시] --- */}
                                {msg.isMe && mId && !isEditing && (
                                    <ActionRow>
                                        <ActionBtn onClick={() => {
                                            setEditingId(mId);
                                            setEditContent(msg.content);
                                        }}>✏️ 수정</ActionBtn>
                                        <ActionBtn onClick={() => handleDelete(mId)}>🗑️ 삭제</ActionBtn>
                                    </ActionRow>
                                )}
                            </BubbleContainer>
                        </Row>
                    );
                })}
            </List>

            <InputWrapper>
                <InputRow onSubmit={handleSend}>
                    <Input
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="메시지 입력..."
                    />
                    <SendBtn type="submit" disabled={isSending}>▲</SendBtn>
                </InputRow>
            </InputWrapper>
        </Container>
    );
};

/* --- 스타일 (수정 UI 필수 포함) --- */
const Container = styled.div` display: flex; flex-direction: column; height: 100vh; width: 100%; max-width: 1000px; margin: auto; background-color: #f0f2f5; border-left: 1px solid #ddd; border-right: 1px solid #ddd; `;
const Header = styled.div` display: flex; align-items: center; justify-content: space-between; padding: 20px 30px; background: #1a2a6c; color: white; `;
const HeaderLeft = styled.div` display: flex; align-items: center; gap: 12px; cursor: pointer; `;
const Title = styled.span` font-weight: 600; font-size: 18px; `;
const Back = styled.span` font-size: 20px; `;
const IconBtn = styled.span` font-size: 22px; cursor: pointer; `;
const List = styled.div` flex: 1; overflow-y: auto; padding: 30px 40px; display: flex; flex-direction: column; gap: 16px; `;
const Row = styled.div` display: flex; justify-content: ${p => p.$isMe ? 'flex-end' : 'flex-start'}; `;
const BubbleContainer = styled.div` display: flex; flex-direction: column; align-items: ${p => p.$isMe ? 'flex-end' : 'flex-start'}; gap: 4px; max-width: 70%; `;
const ContentRow = styled.div` display: flex; align-items: flex-end; gap: 8px; flex-direction: ${p => p.$isMe ? 'row-reverse' : 'row'}; `;
const Bubble = styled.div` padding: 12px 18px; border-radius: ${p => p.$isMe ? '18px 18px 2px 18px' : '18px 18px 18px 2px'}; font-size: 15px; background: ${p => p.$isMe ? '#1a2a6c' : 'white'}; color: ${p => p.$isMe ? 'white' : '#333'}; box-shadow: 0 1px 3px rgba(0,0,0,0.1); `;
const InfoGroup = styled.div` display: flex; flex-direction: column; align-items: ${p => p.$isMe ? 'flex-end' : 'flex-start'}; gap: 2px; `;
const UnreadCount = styled.span` color: #1a2a6c; font-size: 11px; font-weight: bold; `;
const Time = styled.span` font-size: 11px; color: #888; `;
const ActionRow = styled.div` display: flex; gap: 8px; margin-top: 2px; `;
const ActionBtn = styled.span` font-size: 11px; cursor: pointer; color: #ff4757; opacity: 0.7; &:hover { opacity: 1; } `;
const InputWrapper = styled.div` padding: 20px 30px; background: white; border-top: 1px solid #eee; `;
const InputRow = styled.form` display: flex; align-items: center; background: #f1f2f6; padding: 8px 10px 8px 20px; border-radius: 30px; `;
const Input = styled.input` flex: 1; border: none; background: transparent; padding: 12px 0; outline: none; `;
const SendBtn = styled.button` border: none; background: #1a2a6c; color: white; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; `;
const EditWrapper = styled.div` display: flex; flex-direction: column; gap: 4px; `;
const EditInput = styled.input` padding: 8px 12px; border-radius: 12px; border: 1px solid #1a2a6c; outline: none; font-size: 14px; background: white; `;
const EditActions = styled.div` display: flex; gap: 8px; justify-content: flex-end; color: #1a2a6c; font-weight: bold; cursor: pointer; `;

export default ChatRoomPage;