import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../api/api';
import Swal from 'sweetalert2';

const MessageRoom = () => {
    const { userId: targetUserId } = useParams();
    const navigate = useNavigate();

    const [roomId, setRoomId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [partner, setPartner] = useState(null);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const scrollRef = useRef();
    const myId = String(localStorage.getItem('userId') || '');

    // [Fact] 404 에러 해결을 위해 경로를 '/chat'으로 고정합니다.
    // 만약 계속 안 되면 이 부분을 '/api/dm' 또는 '/api/chat'으로 변경하며 테스트해야 합니다.
    const BASE_URL = '/chat';

    const fetchDetails = useCallback(async (id) => {
        try {
            const response = await api.get(`${BASE_URL}/detail/${id}`);
            const { partner: pData, messages: mData } = response.data;
            if (pData) setPartner(pData);
            setMessages(mData || []);
        } catch (err) {
            console.error("상세 내역 로드 실패:", err);
        }
    }, [BASE_URL]);

    const initChatRoom = useCallback(async () => {
        if (!targetUserId) return;
        try {
            setIsLoading(true);
            // 1. 유저 ID로 채팅방 조회
            const res = await api.get(`${BASE_URL}/room/${targetUserId}`);
            const actualRoomId = res.data.roomId || res.data.id;

            if (actualRoomId) {
                setRoomId(actualRoomId);
                await fetchDetails(actualRoomId);
            }
        } catch (err) {
            // [Fact] 404 에러 시 어떤 주소를 불렀는지 정확히 출력
            const errorPath = err.config?.url || '알 수 없는 경로';
            console.error("404 발생 경로:", errorPath);

            Swal.fire({
                icon: 'error',
                title: '연결 오류 (404)',
                text: `서버에서 '${errorPath}' 경로를 찾을 수 없습니다. 백엔드 설정을 확인하세요.`,
            });
        } finally {
            setIsLoading(false);
        }
    }, [targetUserId, fetchDetails, BASE_URL]);

    useEffect(() => {
        initChatRoom();
    }, [initChatRoom]);

    const handleSend = async () => {
        if (!input.trim() || !roomId) return;
        try {
            const response = await api.post(`${BASE_URL}/send`, {
                receiverId: isNaN(targetUserId) ? targetUserId : Number(targetUserId),
                roomId: roomId,
                content: input.trim()
            });
            setMessages(prev => [...prev, response.data]);
            setInput('');
        } catch (err) {
            console.error("메시지 전송 실패:", err);
        }
    };

    if (isLoading) return <FullPage><EmptyText>채팅방 연결 중...</EmptyText></FullPage>;

    return (
        <FullPage>
            <ChatHeader>
                <div className="left">
                    <span className="back" onClick={() => navigate(-1)}>〈</span>
                    <span className="username">{partner?.nickname || 'Chat'}</span>
                </div>
                <div className="close" onClick={() => navigate(-1)}>✕</div>
            </ChatHeader>
            <MsgList>
                {messages.length > 0 ? messages.map((msg, idx) => (
                    <MsgBubble key={msg.id || idx} $isMe={String(msg.senderId) === myId}>
                        <Text $isMe={String(msg.senderId) === myId}>{msg.content}</Text>
                    </MsgBubble>
                )) : <EmptyText>대화 내역이 없습니다. 🫧</EmptyText>}
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

/* 스타일 (가독성 유지) */
const FullPage = styled.div` display: flex; flex-direction: column; width: 100vw; height: 100vh; background: #f8f9fa; `;
const ChatHeader = styled.div` background: #1a2a6c; color: white; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; .username { font-size: 17px; font-weight: bold; } `;
const MsgList = styled.div` flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; `;
const MsgBubble = styled.div` display: flex; justify-content: ${p => p.$isMe ? 'flex-end' : 'flex-start'}; `;
const Text = styled.div` background: ${p => p.$isMe ? '#1a2a6c' : 'white'}; color: ${p => p.$isMe ? 'white' : '#333'}; padding: 10px 15px; border-radius: 15px; max-width: 75%; font-size: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); `;
const InputSection = styled.div` background: white; padding: 15px; border-top: 1px solid #eee; `;
const InputWrapper = styled.div` display: flex; background: #f1f3f5; border-radius: 25px; padding: 5px 15px; `;
const ChatInput = styled.input` flex: 1; border: none; background: transparent; padding: 10px; outline: none; `;
const SendBtn = styled.button` border: none; background: none; color: #1a2a6c; font-weight: bold; cursor: pointer; `;
const EmptyText = styled.div` text-align: center; margin-top: 50px; color: #adb5bd; `;