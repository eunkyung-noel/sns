import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../api';

function MessageListPage() {
    const [rooms, setRooms] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const res = await api.get('/dm/rooms');
                setRooms(res.data);
            } catch (err) { console.error("목록 로드 실패", err); }
        };
        fetchRooms();
    }, []);

    return (
        <Container>
            <Title>Messages</Title>
            <ListContainer>
                {rooms.length > 0 ? rooms.map((room) => (
                    <RoomItem key={room.partnerId} onClick={() => navigate(`/dm/${room.partnerId}`)}>
                        <Avatar>👤</Avatar>
                        <InfoSection>
                            <PartnerName>{room.partnerName}</PartnerName>
                            {/* 읽음 여부에 따라 텍스트 굵기 변경 */}
                            <LastMsg $isUnread={!room.isRead}>{room.lastMessage}</LastMsg>
                        </InfoSection>
                        {/* 안읽은 메시지가 있다면 파란 점 표시 */}
                        {!room.isRead && <UnreadIndicator />}
                    </RoomItem>
                )) : <NoData>대화 내역이 없습니다.</NoData>}
            </ListContainer>
        </Container>
    );
}

// 스타일 생략 (이전 답변의 스타일 컴포넌트 사용)
export default MessageListPage;import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../api';

function MessageListPage() {
    const [rooms, setRooms] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const res = await api.get('/dm/rooms');
                setRooms(res.data);
            } catch (err) { console.error("목록 로드 실패", err); }
        };
        fetchRooms();
    }, []);

    return (
        <Container>
            <Title>Messages</Title>
            <ListContainer>
                {rooms.length > 0 ? rooms.map((room) => (
                    <RoomItem key={room.partnerId} onClick={() => navigate(`/dm/${room.partnerId}`)}>
                        <Avatar>👤</Avatar>
                        <InfoSection>
                            <PartnerName>{room.partnerName}</PartnerName>
                            {/* 읽음 여부에 따라 텍스트 굵기 변경 */}
                            <LastMsg $isUnread={!room.isRead}>{room.lastMessage}</LastMsg>
                        </InfoSection>
                        {/* 안읽은 메시지가 있다면 파란 점 표시 */}
                        {!room.isRead && <UnreadIndicator />}
                    </RoomItem>
                )) : <NoData>대화 내역이 없습니다.</NoData>}
            </ListContainer>
        </Container>
    );
}

// 스타일 생략 (이전 답변의 스타일 컴포넌트 사용)
export default MessageListPage;