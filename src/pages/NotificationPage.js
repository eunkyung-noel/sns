import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../api/api';

const NotificationPage = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);

    // 1. 알림 목록 조회 및 진입 시 자동 읽음 처리
    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data || []);

            // 알림 페이지에 들어왔으므로 모든 알림을 읽음 처리함
            await api.put('/notifications/read-all');
        } catch (err) {
            console.error('알림 로딩 또는 읽음 처리 실패');
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    // 2. 알림 삭제 함수
    const deleteNotification = async (e, id) => {
        e.stopPropagation(); // 클릭 이벤트가 부모(handleNotiClick)로 퍼지는 것 방지
        try {
            await api.delete(`/notifications/${id}`);
            // UI에서 즉시 삭제
            setNotifications(notifications.filter(noti => noti.id !== id));
        } catch (err) {
            console.error('알림 삭제 실패');
        }
    };

    const handleNotiClick = (noti) => {
        if (noti.type === 'MESSAGE') {
            navigate('/dm'); // DM 알림일 경우 DM 페이지로 이동
        } else if (noti.postId) {
            navigate(`/post/${noti.postId}`);
        }
    };

    return (
        <Container>
            <HeaderRow>
                <BackBtn onClick={() => navigate(-1)}>⬅️</BackBtn>
                <Title>알림</Title>
            </HeaderRow>

            <NotiList>
                {notifications.length > 0 ? (
                    notifications.map((noti) => (
                        <NotiItem
                            key={noti.id}
                            isRead={noti.isRead}
                            onClick={() => handleNotiClick(noti)}
                        >
                            <NotiIcon>
                                {noti.type === 'LIKE' ? '❤️' :
                                    noti.type === 'COMMENT' ? '💬' :
                                        noti.type === 'MESSAGE' ? '📩' : '🔔'}
                            </NotiIcon>
                            <NotiContent>
                                <NotiText>
                                    <b>{noti.creator?.nickname || '누군가'}</b>님이
                                    {noti.type === 'LIKE' && ' 게시글을 좋아합니다.'}
                                    {noti.type === 'COMMENT' && ' 댓글을 남겼습니다.'}
                                    {noti.type === 'MESSAGE' && ' 메시지를 보냈습니다.'}
                                </NotiText>
                                <NotiTime>{new Date(noti.createdAt).toLocaleString()}</NotiTime>
                            </NotiContent>
                            {/* 삭제 버튼 추가 */}
                            <DeleteBtn onClick={(e) => deleteNotification(e, noti.id)}>
                                삭제
                            </DeleteBtn>
                        </NotiItem>
                    ))
                ) : (
                    <EmptyMsg>새로운 알림이 없습니다. 🫧</EmptyMsg>
                )}
            </NotiList>
        </Container>
    );
};

// 스타일 컴포넌트
const Container = styled.div` max-width: 500px; margin: auto; background: #f0f8ff; min-height: 100vh; padding: 20px; `;
const HeaderRow = styled.div` display: flex; align-items: center; gap: 15px; margin-bottom: 20px; `;
const BackBtn = styled.button` background: none; border: none; font-size: 20px; cursor: pointer; `;
const Title = styled.h2` color: #2d3436; margin: 0; `;
const NotiList = styled.div` display: flex; flex-direction: column; gap: 12px; `;
const NotiItem = styled.div` 
    background: ${props => props.isRead ? '#fff' : '#e3f2fd'}; 
    padding: 15px; 
    border-radius: 18px; 
    display: flex; 
    align-items: center; 
    gap: 12px; 
    box-shadow: 0 2px 10px rgba(0,0,0,0.05); 
    cursor: pointer; 
    position: relative;
    border: ${props => props.isRead ? 'none' : '1px solid #74b9ff'}; 
    &:hover { background: #f1f2f6; }
`;
const NotiIcon = styled.div` font-size: 24px; `;
const NotiContent = styled.div` display: flex; flex-direction: column; flex: 1; `;
const NotiText = styled.span` font-size: 14px; color: #2d3436; `;
const NotiTime = styled.span` font-size: 11px; color: #b2bec3; margin-top: 4px; `;
const EmptyMsg = styled.div` text-align: center; color: #b2bec3; margin-top: 100px; `;

// 삭제 버튼 스타일 추가
const DeleteBtn = styled.button`
    background: #ff7675;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 5px 10px;
    font-size: 12px;
    cursor: pointer;
    &:hover { background: #d63031; }
`;

export default NotificationPage;