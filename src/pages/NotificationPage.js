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
            await api.put('/notifications/read-all');
        } catch (err) {
            console.error('알림 로딩 실패');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const deleteNotification = async (e, id) => {
        e.stopPropagation();
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(notifications.filter(noti => noti.id !== id));
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

    if (loading) return <Loading>🫧 알림을 확인하는 중...</Loading>;

    return (
        <Container>
            <Header>
                <BackBtn onClick={() => navigate(-1)}>〈</BackBtn>
                <TitleCol>
                    <Title>알림 센터</Title>
                    <SubTitle>버블에서 일어난 새로운 소식들을 확인하세요.</SubTitle>
                </TitleCol>
            </Header>

            <NotiList>
                {notifications.length > 0 ? (
                    notifications.map((noti) => (
                        <NotiItem
                            key={noti.id}
                            $isRead={noti.isRead}
                            onClick={() => handleNotiClick(noti)}
                        >
                            <NotiIcon $type={noti.type}>
                                {noti.type === 'LIKE' ? '❤️' :
                                    noti.type === 'COMMENT' ? '💬' :
                                        noti.type === 'MESSAGE' ? '📩' : '🔔'}
                            </NotiIcon>
                            <NotiContent>
                                <NotiText>
                                    <b>{noti.creator?.nickname || '누군가'}</b>님이
                                    {noti.type === 'LIKE' && ' 회원님의 게시글을 좋아합니다.'}
                                    {noti.type === 'COMMENT' && ' 게시글에 댓글을 남겼습니다.'}
                                    {noti.type === 'MESSAGE' && ' 새로운 메시지를 보냈습니다.'}
                                </NotiText>
                                <NotiTime>{new Date(noti.createdAt).toLocaleString('ko-KR')}</NotiTime>
                            </NotiContent>
                            <DeleteBtn onClick={(e) => deleteNotification(e, noti.id)}>
                                삭제
                            </DeleteBtn>
                        </NotiItem>
                    ))
                ) : (
                    <EmptySection>
                        <div className="icon">🫧</div>
                        <p>새로운 알림이 없습니다.</p>
                    </EmptySection>
                )}
            </NotiList>
        </Container>
    );
};

/* --- 스타일 정의: 와이드 웹 최적화 --- */

const Container = styled.div`
    max-width: 900px;           /* 🔍 가로 너비 확장 */
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
    background: ${props => props.$isRead ? '#ffffff' : '#f8fbff'}; 
    padding: 20px 30px; 
    border-radius: 20px; 
    display: flex; 
    align-items: center; 
    gap: 20px; 
    box-shadow: 0 4px 15px rgba(116, 185, 255, 0.05); 
    cursor: pointer; 
    border: 1px solid ${props => props.$isRead ? '#f1f2f6' : '#e1f0ff'}; 
    transition: all 0.2s;
    
    &:hover { 
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(116, 185, 255, 0.1);
        background: white;
    }
`;

const NotiIcon = styled.div` 
    font-size: 28px; 
    width: 55px; height: 55px;
    background: white;
    border-radius: 15px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 10px rgba(0,0,0,0.03);
`;

const NotiContent = styled.div` display: flex; flex-direction: column; flex: 1; `;
const NotiText = styled.span` 
    font-size: 16px; 
    color: #2d3436; 
    b { color: #1a2a6c; font-weight: 800; }
`;

const NotiTime = styled.span` font-size: 12px; color: #b2bec3; margin-top: 6px; `;

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

const Loading = styled.div` 
    display: flex; justify-content: center; align-items: center; height: 80vh; 
    color: #74b9ff; font-weight: 900; font-size: 20px; 
`;

const EmptySection = styled.div`
    text-align: center; padding: 150px 0;
    .icon { font-size: 60px; margin-bottom: 20px; opacity: 0.5; }
    p { color: #b2bec3; font-size: 18px; font-weight: bold; }
`;

export default NotificationPage;