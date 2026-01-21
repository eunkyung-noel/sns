import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import api from '../api/api';

/* 배지 애니메이션 추가 */
const bubbleShake = keyframes`
  0%, 100% { border-radius: 60% 40% 70% 30% / 40% 50% 60% 50%; }
  50% { border-radius: 40% 60% 30% 70% / 50% 40% 50% 60%; }
`;

function MessageListPage() {
    const [rooms, setRooms] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const res = await api.get('/api/dm/rooms');
                setRooms(res.data);
            } catch (err) {
                console.error("목록 로드 실패", err);
            }
        };
        fetchRooms();
    }, []);

    return (
        <Container>
            <Header>
                <Title>Messages 🫧</Title>
            </Header>
            <ListContainer>
                {rooms.length > 0 ? rooms.map((room) => (
                    <RoomItem key={room.opponent.id} onClick={() => navigate(`/dm/${room.opponent.id}`)}>
                        <AvatarWrapper>
                            {room.opponent.profilePic ? (
                                <AvatarImg src={`http://localhost:5001${room.opponent.profilePic}`} />
                            ) : (
                                <DefaultAvatar>👤</DefaultAvatar>
                            )}
                        </AvatarWrapper>

                        <InfoSection>
                            <NameRow>
                                <PartnerName>@{room.opponent.nickname}</PartnerName>
                                {/* 수정 포인트: 미성년자 연두색(#2ecc71) 적용된 배지 추가 */}
                                <BubbleBadge $isAdult={room.opponent.isAdult}>
                                    {room.opponent.isAdult ? '🐋' : '🐠'}
                                </BubbleBadge>
                            </NameRow>
                            <LastMsg $isUnread={!room.isRead}>{room.lastMessage}</LastMsg>
                        </InfoSection>

                        <StatusSection>
                            {!room.isRead && <UnreadIndicator />}
                            <TimeText>
                                {new Date(room.createdAt).toLocaleDateString()}
                            </TimeText>
                        </StatusSection>
                    </RoomItem>
                )) : (
                    <NoData>대화 내역이 없습니다. 🫧</NoData>
                )}
            </ListContainer>
        </Container>
    );
}

/* --- 스타일 컴포넌트 --- */

const Container = styled.div`
    max-width: 800px;
    margin: 40px auto;
    padding: 0 20px;
    min-height: 80vh;
`;

const Header = styled.div`
    margin-bottom: 30px;
    border-bottom: 2px solid #74b9ff;
    padding-bottom: 15px;
`;

const Title = styled.h2`
    font-size: 28px;
    color: #1a2a6c;
    margin: 0;
    font-weight: 800;
`;

const ListContainer = styled.div`
    background: white;
    border-radius: 30px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
    overflow: hidden;
`;

const RoomItem = styled.div`
    display: flex;
    align-items: center;
    padding: 25px 40px;
    gap: 20px;
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 1px solid #f1f2f6;
    &:last-child { border-bottom: none; }
    &:hover {
        background: #f0f8ff;
        transform: scale(1.01);
    }
`;

const AvatarWrapper = styled.div`
    width: 65px;
    height: 65px;
    border-radius: 50%;
    background: #f1f2f6;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    border: 2px solid #fff;
    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
`;

const AvatarImg = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
`;

const DefaultAvatar = styled.span` font-size: 30px; `;

const InfoSection = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 5px;
`;

/* 닉네임과 배지를 가로로 정렬하기 위한 컨테이너 */
const NameRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const PartnerName = styled.span`
    font-size: 18px;
    font-weight: 700;
    color: #2d3436;
`;

/* 배지 스타일: 미성년자(#2ecc71 연두색) 수정 완료 */
const BubbleBadge = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 26px;
    height: 26px;
    font-size: 13px;
    background: white;
    border: 2px solid ${props => props.$isAdult ? '#74b9ff' : '#2ecc71'};
    border-radius: 60% 40% 70% 30% / 40% 50% 60% 50%;
    animation: ${bubbleShake} 4s ease-in-out infinite;
`;

const LastMsg = styled.p`
    font-size: 15px;
    color: ${props => props.$isUnread ? '#2d3436' : '#b2bec3'};
    font-weight: ${props => props.$isUnread ? '700' : '400'};
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 400px;
`;

const StatusSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
`;

const UnreadIndicator = styled.div`
    width: 12px;
    height: 12px;
    background: #74b9ff;
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(116, 185, 255, 0.6);
`;

const TimeText = styled.span` font-size: 12px; color: #b2bec3; `;
const NoData = styled.div` text-align: center; padding: 100px 0; font-size: 18px; color: #b2bec3; `;

export default MessageListPage;