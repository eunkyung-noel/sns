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
            setLoading(true);
            const res = await api.get('/notifications');
            setNotifications(res.data || []);
            // 읽음 처리 API 호출
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

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error('알림 삭제 실패');
        }
    };

    const handleNotiClick = (noti) => {
        if (noti.type === 'MESSAGE') {
            navigate('/dm');
        } else if (noti.postId) {
            navigate(`/post/${noti.postId}`);
        }
    };

    if (loading) return <Container><Msg>🫧 알림을 불러오는 중...</Msg></Container>;

    return (
        <Container>
            <Header>
                <BackBtn onClick={() => navigate(-1)}>〈</BackBtn>
                <TitleCol>
                    <Title>알림 센터</Title>
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
                            <IconWrapper $type={noti.type}>
                                {noti.type === 'LIKE' ? '❤️' :
                                    noti.type === 'COMMENT' ? '💬' :
                                        noti.type === 'MESSAGE' ? '📩' : '🔔'}
                            </IconWrapper>

                            <ContentCol>
                                <MessageText>
                                    <b>{noti.creator?.nickname || '사용자'}</b>님이
                                    {noti.type === 'LIKE' && ' 게시글을 좋아합니다.'}
                                    {noti.type === 'COMMENT' && ' 게시글에 댓글을 남겼습니다.'}
                                    {noti.type === 'MESSAGE' && ' 새로운 메시지를 보냈습니다.'}
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

/* --- 웹 최적화 스타일 정의 --- */

const Container = styled.div`
    max-width: 900px; /* 🔍 와이드 규격 통일 */
    margin: 40px auto; 
    padding: 0 20px;
    min-height: 100vh;
`;

const Header = styled.div`
    display: flex; 
    align-items: center; 
    gap: 20px; 
    margin-bottom: 40px; 
    padding-bottom: 25px;
    border-bottom: 2px solid #f0f7ff;
`;

const BackBtn = styled.button`
    background: #f1f2f6; border: none; width: 45px; height: 45px; 
    border-radius: 50%; font-size: 20px; cursor: pointer; color: #74b9ff;
    display: flex; align-items: center; justify-content: center;
    transition: 0.2s;
    &:hover { background: #74b9ff; color: white; }
`;

const TitleCol = styled.div` display: flex; flex-direction: column; gap: 4px; `;
const Title = styled.h2` margin: 0; font-size: 26px; font-weight: 900; color: #2d3436; `;
const SubTitle = styled.span` font-size: 14px; color: #b2bec3; `;

const NotiList = styled.div` display: flex; flex-direction: column; gap: 15px; `;

const NotiItem = styled.div`
    background: ${props => props.$isRead ? '#fff' : '#f8fbff'};
    padding: 20px 30px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 20px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(116, 185, 255, 0.06);
    transition: all 0.2s;
    border: 1px solid ${props => props.$isRead ? '#f1f2f6' : '#e1f0ff'};

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(116, 185, 255, 0.12);
        background: white;
    }
`;

const IconWrapper = styled.div`
    width: 55px; height: 55px;
    background: #ffffff;
    border-radius: 15px;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.03);
`;

const ContentCol = styled.div` display: flex; flex-direction: column; gap: 6px; flex: 1; `;
const MessageText = styled.span` 
    font-size: 16px; color: #2d3436; 
    b { color: #1a2a6c; font-weight: 800; }
`;
const TimeText = styled.span` font-size: 12px; color: #b2bec3; `;

const ActionGroup = styled.div` display: flex; align-items: center; gap: 15px; `;
const UnreadBadge = styled.div` 
    background: #ff4757; color: white; font-size: 10px; font-weight: 900;
    padding: 3px 8px; border-radius: 6px; letter-spacing: 0.5px;
`;

const DeleteBtn = styled.button`
    background: #fff5f5;
    color: #ff7675;
    border: 1px solid #ffe6e6;
    border-radius: 10px;
    padding: 8px 15px;
    font-size: 13px;
    font-weight: bold;
    cursor: pointer;
    transition: 0.2s;
    &:hover { background: #ff7675; color: white; border-color: #ff7675; }
`;

const Msg = styled.div` text-align: center; color: #74b9ff; font-weight: 900; padding: 100px; font-size: 18px; `;
const EmptyMsg = styled.div` 
    text-align: center; color: #b2bec3; padding: 150px 0; font-size: 16px; font-weight: bold;
    .icon { font-size: 50px; margin-bottom: 15px; opacity: 0.4; }
`;

export default NotificationPage;