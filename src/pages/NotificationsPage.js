import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await api.get('/notifications');
                setNotifications(res.data || []);
            } catch (err) {
                console.error("Failed to fetch notifications:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    const handleNotiClick = async (noti) => {
        try {
            await api.put(`/notifications/${noti.id}/read`);
            if (noti.type === 'COMMENT') navigate(`/post/${noti.targetId}`);
            if (noti.type === 'MESSAGE') navigate(`/dm/${noti.senderId}`);
        } catch (err) {
            console.error("Error updating notification:", err);
        }
    };

    return (
        <Container>
            <HeaderSection>
                <Title>Sky Alerts</Title>
                <Subtitle>새로운 소식이 도착했습니다 ☁️</Subtitle>
            </HeaderSection>

            {loading ? (
                <StatusMsg>알림을 가져오는 중...</StatusMsg>
            ) : (
                <NotiList>
                    {notifications.length > 0 ? (
                        notifications.map(noti => (
                            <NotiBubble
                                key={noti.id}
                                isRead={noti.isRead}
                                onClick={() => handleNotiClick(noti)}
                            >
                                <IconWrapper type={noti.type}>
                                    {noti.type === 'COMMENT' ? '💬' : '✉️'}
                                </IconWrapper>
                                <ContentWrapper>
                                    <Message>
                                        <Strong>{noti.senderName}</Strong> {noti.message}
                                    </Message>
                                    <TimeText>{new Date(noti.createdAt).toLocaleString()}</TimeText>
                                </ContentWrapper>
                                {!noti.isRead && <UnreadDot />}
                            </NotiBubble>
                        ))
                    ) : (
                        <EmptyMsg>아직 도착한 알림이 없습니다.</EmptyMsg>
                    )}
                </NotiList>
            )}
        </Container>
    );
}

export default NotificationsPage;

const Container = styled.div` max-width: 600px; margin: 40px auto; padding: 0 20px; `;
const HeaderSection = styled.div` margin-bottom: 30px; `;
const Title = styled.h2` color: #1a2a6c; font-size: 28px; font-weight: 900; margin: 0; `;
const Subtitle = styled.p` color: #666; font-weight: 500; margin-top: 5px; `;
const NotiList = styled.div` display: flex; flex-direction: column; gap: 12px; `;

const NotiBubble = styled.div`
    background: ${props => props.isRead ? '#f9f9f9' : '#fff'};
    padding: 20px;
    border-radius: 20px;
    border: 1px solid ${props => props.isRead ? '#eee' : '#00BFFF'};
    display: flex;
    align-items: center;
    gap: 15px;
    cursor: pointer;
    position: relative;
    box-shadow: 0 4px 10px rgba(0,0,0,0.03);
    &:hover { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(0,0,0,0.06); }
`;

const IconWrapper = styled.div`
    width: 45px; height: 45px; border-radius: 50%;
    background: #f0f8ff;
    display: flex; align-items: center; justify-content: center; font-size: 20px;
`;

const ContentWrapper = styled.div` flex: 1; `;
const Message = styled.p` color: #333; font-size: 15px; margin: 0; `;
const Strong = styled.span` font-weight: 800; color: #1a2a6c; `;
const TimeText = styled.span` font-size: 12px; color: #999; `;
const UnreadDot = styled.div` width: 10px; height: 10px; background: #ff6464; border-radius: 50%; position: absolute; right: 20px; `;
const StatusMsg = styled.div` text-align: center; margin-top: 50px; color: #666; `;
const EmptyMsg = styled.div` text-align: center; color: #999; padding: 100px 0; `;