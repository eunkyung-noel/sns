import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../api/api';
import Swal from 'sweetalert2';

const NotificationPage = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

    // [Fact] 이미지 URL 정규화 함수
    const getFullImageUrl = (path) => {
        if (!path) return null;
        const baseUrl = SERVER_URL.endsWith('/') ? SERVER_URL.slice(0, -1) : SERVER_URL;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${baseUrl}${cleanPath}?v=${new Date().getTime()}`;
    };

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await api.get('/notifications');
            setNotifications(res.data || []);

            // [Fact] 알림 페이지 진입 시 전체 읽음 처리 시도
            try {
                await api.put('/notifications/read-all');
            } catch (e) {
                console.warn("전체 읽음 처리 API 미구현 혹은 오류");
            }
        } catch (err) {
            console.error('알림 로드 실패:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            Swal.fire('에러', '알림 삭제에 실패했습니다.', 'error');
        }
    };

    const handleNotiClick = (noti) => {
        // [Fact] 알림 타입별 이동 경로 최적화 (DM, FOLLOW, LIKE, COMMENT)
        switch (noti.type) {
            case 'MESSAGE':
            case 'DM':
                navigate('/chat'); // 또는 `/chat/${noti.senderId}`
                break;
            case 'FOLLOW':
                navigate(`/profile/${noti.senderId || noti.creatorId}`);
                break;
            case 'LIKE':
            case 'COMMENT':
                if (noti.postId) {
                    navigate(`/post/${noti.postId}`);
                } else {
                    Swal.fire('알림', '해당 게시물을 찾을 수 없습니다.', 'info');
                }
                break;
            default:
                console.warn("알 수 없는 알림 타입:", noti.type);
        }
    };

    if (loading) return <Container><Msg>🫧 알림을 불러오는 중...</Msg></Container>;

    return (
        <Container>
            <Header>
                <BackBtn onClick={() => navigate(-1)}>〈</BackBtn>
                <TitleCol>
                    <Title>알림 센터 🫧</Title>
                    <SubTitle>버블의 최신 소식을 한눈에 확인하세요.</SubTitle>
                </TitleCol>
            </Header>

            <NotiList>
                {notifications.length === 0 ? (
                    <EmptyMsg>
                        <div className="icon">🔔</div>
                        새로운 알림이 없습니다.
                    </EmptyMsg>
                ) : (
                    notifications.map((noti) => (
                        <NotiItem
                            key={noti.id}
                            $isRead={noti.isRead}
                            onClick={() => handleNotiClick(noti)}
                        >
                            <SenderAvatar
                                src={noti.sender?.profilePic || noti.creator?.profilePic
                                    ? getFullImageUrl(noti.sender?.profilePic || noti.creator?.profilePic)
                                    : `https://ui-avatars.com/api/?name=${noti.sender?.nickname || noti.creator?.nickname}&background=74c0fc&color=fff`}
                            />

                            <ContentCol>
                                <MessageText>
                                    <b>{noti.sender?.nickname || noti.creator?.nickname || '사용자'}</b>님이
                                    {noti.type === 'LIKE' && ' 게시글을 좋아합니다. ❤️'}
                                    {noti.type === 'COMMENT' && ' 게시글에 댓글을 남겼습니다. 💬'}
                                    {(noti.type === 'MESSAGE' || noti.type === 'DM') && ' 새로운 메시지를 보냈습니다. 📩'}
                                    {noti.type === 'FOLLOW' && ' 회원님을 팔로우하기 시작했습니다. 👤'}
                                </MessageText>
                                <TimeText>{new Date(noti.createdAt).toLocaleString('ko-KR')}</TimeText>
                            </ContentCol>

                            <ActionGroup>
                                {!noti.isRead && <UnreadBadge>NEW</UnreadBadge>}
                                <DeleteBtn onClick={(e) => handleDelete(e, noti.id)}>삭제</DeleteBtn>
                            </ActionGroup>
                        </NotiItem>
                    ))
                )}
            </NotiList>
        </Container>
    );
};

/* --- 스타일 정의 --- */
const Container = styled.div` max-width: 900px; margin: 40px auto; padding: 0 20px; min-height: 100vh; `;
const Header = styled.div` display: flex; align-items: center; gap: 20px; margin-bottom: 40px; padding-bottom: 25px; border-bottom: 2px solid #f0f7ff; `;
const BackBtn = styled.button` background: #f1f2f6; border: none; width: 45px; height: 45px; border-radius: 50%; font-size: 20px; cursor: pointer; color: #74b9ff; display: flex; align-items: center; justify-content: center; transition: 0.2s; &:hover { background: #74b9ff; color: white; } `;
const TitleCol = styled.div` display: flex; flex-direction: column; gap: 4px; `;
const Title = styled.h2` margin: 0; font-size: 26px; font-weight: 900; color: #2d3436; `;
const SubTitle = styled.span` font-size: 14px; color: #b2bec3; `;
const NotiList = styled.div` display: flex; flex-direction: column; gap: 15px; `;
const NotiItem = styled.div` background: ${props => props.$isRead ? '#fff' : '#f8fbff'}; padding: 20px 30px; border-radius: 20px; display: flex; align-items: center; gap: 20px; cursor: pointer; box-shadow: 0 4px 15px rgba(116, 185, 255, 0.06); transition: all 0.2s; border: 1px solid ${props => props.$isRead ? '#f1f2f6' : '#e1f0ff'}; &:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(116, 185, 255, 0.12); background: white; } `;

const SenderAvatar = styled.img`
    width: 55px;
    height: 55px;
    border-radius: 18px;
    object-fit: cover;
    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
`;

const ContentCol = styled.div` display: flex; flex-direction: column; gap: 6px; flex: 1; `;
const MessageText = styled.span` font-size: 16px; color: #2d3436; b { color: #1a2a6c; font-weight: 800; } `;
const TimeText = styled.span` font-size: 12px; color: #b2bec3; `;
const ActionGroup = styled.div` display: flex; align-items: center; gap: 15px; `;
const UnreadBadge = styled.div` background: #ff4757; color: white; font-size: 10px; font-weight: 900; padding: 3px 8px; border-radius: 6px; letter-spacing: 0.5px; `;
const DeleteBtn = styled.button` background: #fff5f5; color: #ff7675; border: 1px solid #ffe6e6; border-radius: 10px; padding: 8px 15px; font-size: 13px; font-weight: bold; cursor: pointer; transition: 0.2s; &:hover { background: #ff7675; color: white; border-color: #ff7675; } `;
const Msg = styled.div` text-align: center; color: #74b9ff; font-weight: 900; padding: 100px; font-size: 18px; `;
const EmptyMsg = styled.div` text-align: center; color: #b2bec3; padding: 150px 0; font-size: 16px; font-weight: bold; .icon { font-size: 50px; margin-bottom: 15px; opacity: 0.4; } `;

export default NotificationPage;