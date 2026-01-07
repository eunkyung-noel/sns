import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../api/api';

const NotificationPage = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            // [Fact] 백엔드 GET /api/notifications 호출
            const res = await api.get('/notifications');
            setNotifications(res.data || []);

            // 페이지 진입 시 모두 읽음 처리 (백엔드 PUT /api/notifications/read-all)
            await api.put('/notifications/read-all');
        } catch (err) {
            console.error('알림 로드 실패:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    // 알림 삭제 함수
    const handleDelete = async (e, id) => {
        e.stopPropagation(); // 클릭 이벤트 전파 방지 (페이지 이동 막기)
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error('알림 삭제 실패');
        }
    };

    const handleNotiClick = (noti) => {
        // [Fact] 백엔드 스키마의 type과 postId 필드 기준 분기
        if (noti.type === 'MESSAGE') {
            navigate('/dm');
        } else if (noti.postId) {
            navigate(`/post/${noti.postId}`);
        }
    };

    if (loading) return <Container><Msg>알림을 불러오는 중...</Msg></Container>;

    return (
        <Container>
            <Header>
                <BackBtn onClick={() => navigate(-1)}>⬅️</BackBtn>
                <Title>알림</Title>
            </Header>

            {notifications.length === 0 ? (
                <Msg>새로운 알림이 없습니다. 🫧</Msg>
            ) : (
                notifications.map((noti) => (
                    <NotiItem
                        key={noti.id}
                        isRead={noti.isRead}
                        onClick={() => handleNotiClick(noti)}
                    >
                        <Icon>
                            {noti.type === 'LIKE' ? '❤️' :
                                noti.type === 'COMMENT' ? '💬' :
                                    noti.type === 'MESSAGE' ? '📩' : '🔔'}
                        </Icon>
                        <ContentCol>
                            <MessageText>
                                <b>{noti.creator?.nickname || '사용자'}</b>님이
                                {noti.type === 'LIKE' && ' 게시글을 좋아합니다.'}
                                {noti.type === 'COMMENT' && ' 댓글을 남겼습니다.'}
                                {noti.type === 'MESSAGE' && ' 메시지를 보냈습니다.'}
                            </MessageText>
                            <TimeText>{new Date(noti.createdAt).toLocaleString()}</TimeText>
                        </ContentCol>

                        <ActionGroup>
                            {!noti.isRead && <UnreadDot />}
                            <DeleteBtn onClick={(e) => handleDelete(e, noti.id)}>삭제</DeleteBtn>
                        </ActionGroup>
                    </NotiItem>
                ))
            )}
        </Container>
    );
};

// --- Styles ---
const Container = styled.div` max-width: 500px; margin: auto; padding: 20px; background-color: #f0f8ff; min-height: 100vh; `;
const Header = styled.div` display: flex; align-items: center; gap: 15px; margin-bottom: 25px; `;
const BackBtn = styled.button` background: none; border: none; font-size: 20px; cursor: pointer; `;
const Title = styled.h1` font-size: 20px; color: #2d3436; margin: 0; `;

const NotiItem = styled.div`
    background: ${props => props.isRead ? '#fff' : '#e3f2fd'};
    padding: 15px;
    border-radius: 15px;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    position: relative;
    border: ${props => props.isRead ? 'none' : '1px solid #74b9ff'};
`;

const Icon = styled.span` font-size: 20px; `;
const ContentCol = styled.div` display: flex; flex-direction: column; gap: 4px; flex: 1; `;
const MessageText = styled.span` font-size: 14px; color: #2d3436; `;
const TimeText = styled.span` font-size: 11px; color: #b2bec3; `;

const ActionGroup = styled.div` display: flex; flex-direction: column; align-items: flex-end; gap: 8px; `;
const UnreadDot = styled.div` width: 8px; height: 8px; background-color: #ff4757; border-radius: 50%; `;

const DeleteBtn = styled.button`
    background: #fab1a0;
    color: #d63031;
    border: none;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 11px;
    cursor: pointer;
    &:hover { background: #ff7675; color: white; }
`;

const Msg = styled.p` text-align: center; color: #636e72; margin-top: 50px; `;

export default NotificationPage;