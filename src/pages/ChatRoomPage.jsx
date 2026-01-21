import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/api';
import Swal from 'sweetalert2';

const ChatRoomPage = () => {
    const { roomId: targetId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [partner, setPartner] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [restrictionMsg, setRestrictionMsg] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const scrollRef = useRef(null);
    const socketRef = useRef(null);
    const myId = localStorage.getItem('userId');
    const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const loadChatData = useCallback(async () => {
        if (!targetId) {
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            console.log("Fetching chat data for targetId:", targetId);

            const res = await api.get(`/chat/detail/${targetId}`);
            console.log("Server Response:", res.data);

            const { me, partner: pData, messages: mData } = res.data;

            if (pData) {
                setPartner(pData);
                setMessages((mData || []).map(m => ({
                    ...m,
                    isMe: String(m.senderId) === String(myId)
                })));

                if (me && pData) {
                    if (me.isAdult !== pData.isAdult) {
                        setRestrictionMsg('성인과 미성년자 간의 대화는 제한될 수 있습니다.');
                    } else {
                        setRestrictionMsg('');
                    }
                }
            }
        } catch (err) {
            console.error("Load Chat Data Error:", err);
            Swal.fire('오류', '채팅 정보를 불러오는 중 에러가 발생했습니다.', 'error');
        } finally {
            // [Fact] 성공하든 실패하든 로딩 상태를 반드시 해제
            setIsLoading(false);
        }
    }, [targetId, myId]);

    useEffect(() => {
        loadChatData();
        socketRef.current = io(SERVER_URL, {
            transports: ['websocket'],
            auth: { token: localStorage.getItem('token') }
        });
        socketRef.current.on('receiveDm', (newMsg) => {
            if (String(newMsg.senderId) === String(targetId)) {
                setMessages(prev => [...prev, { ...newMsg, isMe: false }]);
            }
        });
        return () => socketRef.current?.disconnect();
    }, [targetId, SERVER_URL, loadChatData]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (restrictionMsg || !message.trim() || isSending) return;
        setIsSending(true);
        try {
            const res = await api.post(`/chat/send`, {
                receiverId: Number(targetId),
                content: message.trim()
            });
            const newMsg = res.data;
            setMessages(prev => [...prev, { ...newMsg, isMe: true, createdAt: new Date().toISOString() }]);
            socketRef.current.emit('sendDm', { receiverId: targetId, content: message.trim() });
            setMessage('');
        } catch (err) {
            Swal.fire('오류', '메시지 전송 실패', 'error');
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) return <FullPage><LoadingSpinner /> 데이터를 불러오는 중입니다...</FullPage>;

    return (
        <FullPage>
            <MainContainer>
                <SideCard>
                    <ProfileCircle
                        $isAdult={partner?.isAdult}
                        $src={partner?.profilePic ? `${SERVER_URL}${partner.profilePic}` : null}
                    >
                        {!partner?.profilePic && partner?.nickname ? partner.nickname[0] : 'U'}
                    </ProfileCircle>
                    <PartnerNickname>@{partner?.nickname || 'Unknown'}</PartnerNickname>
                    <Badge $isAdult={partner?.isAdult}>{partner?.isAdult ? '성인 인증 🐋' : '미성년자 🐠'}</Badge>
                    <StatsGrid>
                        <StatItem><StatLabel>게시물</StatLabel><StatValue>{partner?.counts?.posts || 0}</StatValue></StatItem>
                        <StatItem><StatLabel>팔로워</StatLabel><StatValue>{partner?.counts?.followers || 0}</StatValue></StatItem>
                        <StatItem><StatLabel>팔로잉</StatLabel><StatValue>{partner?.counts?.following || 0}</StatValue></StatItem>
                    </StatsGrid>
                    <FollowButton onClick={() => api.post(`/auth/follow/${targetId}`).then(() => loadChatData())}>
                        {partner?.isFollowing ? '팔로잉' : '팔로우'}
                    </FollowButton>
                    <BackButton onClick={() => navigate(-1)}>뒤로가기</BackButton>
                </SideCard>
                <ChatArea>
                    <ChatHeader>{partner?.nickname}님과의 대화</ChatHeader>
                    {restrictionMsg && <RestrictionBanner>{restrictionMsg}</RestrictionBanner>}
                    <MessageList ref={scrollRef}>
                        {messages.map((msg, i) => (
                            <MessageRow key={msg.id || i} $isMe={msg.isMe}>
                                <BubbleContainer $isMe={msg.isMe}>
                                    <Bubble $isMe={msg.isMe}>{msg.content}</Bubble>
                                    <TimeStamp>{formatTime(msg.createdAt)}</TimeStamp>
                                </BubbleContainer>
                            </MessageRow>
                        ))}
                    </MessageList>
                    <InputArea>
                        <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px' }}>
                            <ChatInput value={message} onChange={e => setMessage(e.target.value)} placeholder="메시지 입력..." />
                            <SendButton type="submit" disabled={!message.trim()}>전송</SendButton>
                        </form>
                    </InputArea>
                </ChatArea>
            </MainContainer>
        </FullPage>
    );
};

const LoadingSpinner = styled.div`
    width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid #4dabf7;
    border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 10px;
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
`;
const FullPage = styled.div` background: #f0f2f5; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif; `;
const MainContainer = styled.div` display: flex; width: 950px; height: 85vh; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); `;
const SideCard = styled.div` width: 260px; background: #fafafa; border-right: 1px solid #eee; display: flex; flex-direction: column; align-items: center; padding: 40px 15px; `;
const ProfileCircle = styled.div` width: 80px; height: 80px; border-radius: 50%; background-color: ${p => p.$isAdult ? '#74c0fc' : '#63e6be'}; background-image: ${p => p.$src ? `url(${p.$src})` : 'none'}; background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; margin-bottom: 12px; border: 3px solid white; `;
const PartnerNickname = styled.div` font-weight: bold; font-size: 17px; color: #343a40; `;
const Badge = styled.div` font-size: 11px; font-weight: 800; padding: 5px 14px; border-radius: 15px; margin: 10px 0 25px; background: ${p => p.$isAdult ? '#e7f5ff' : '#ebfbee'}; color: ${p => p.$isAdult ? '#228be6' : '#2f9e44'}; border: 1px solid ${p => p.$isAdult ? '#a5d8ff' : '#b2f2bb'}; `;
const StatsGrid = styled.div` display: grid; grid-template-columns: repeat(3, 1fr); width: 100%; border-top: 1px solid #eee; border-bottom: 1px solid #eee; padding: 20px 0; margin-bottom: 20px; `;
const StatItem = styled.div` display: flex; flex-direction: column; align-items: center; gap: 4px; `;
const StatLabel = styled.div` font-size: 11px; color: #adb5bd; `;
const StatValue = styled.div` font-size: 14px; font-weight: bold; color: #495057; `;
const FollowButton = styled.button` width: 100%; padding: 10px; margin-bottom: 15px; border-radius: 10px; border: none; font-weight: bold; cursor: pointer; background: #4dabf7; color: white; `;
const ChatArea = styled.div` flex: 1; display: flex; flex-direction: column; `;
const ChatHeader = styled.div` padding: 20px; border-bottom: 1px solid #f5f5f5; font-weight: bold; `;
const RestrictionBanner = styled.div` background: #fff5f5; color: #ff6b6b; padding: 10px; text-align: center; font-size: 12px; `;
const MessageList = styled.div` flex: 1; overflow-y: auto; padding: 25px; display: flex; flex-direction: column; gap: 20px; `;
const MessageRow = styled.div` display: flex; justify-content: ${p => p.$isMe ? 'flex-end' : 'flex-start'}; `;
const BubbleContainer = styled.div` display: flex; flex-direction: ${p => p.$isMe ? 'row-reverse' : 'row'}; align-items: flex-end; gap: 8px; `;
const Bubble = styled.div` max-width: 350px; padding: 12px 16px; border-radius: 18px; background: ${p => p.$isMe ? '#4dabf7' : '#f1f3f5'}; color: ${p => p.$isMe ? 'white' : '#333'}; font-size: 14px; `;
const TimeStamp = styled.div` font-size: 10px; color: #adb5bd; `;
const InputArea = styled.div` padding: 20px; border-top: 1px solid #f5f5f5; `;
const ChatInput = styled.input` flex: 1; padding: 12px 20px; border-radius: 25px; border: 1px solid #eee; outline: none; background: #f8f9fa; `;
const SendButton = styled.button` background: #4dabf7; color: white; border: none; padding: 10px 20px; border-radius: 25px; cursor: pointer; font-weight: bold; `;
const BackButton = styled.button` margin-top: auto; background: none; border: none; color: #adb5bd; font-size: 12px; text-decoration: underline; cursor: pointer; `;

export default ChatRoomPage;