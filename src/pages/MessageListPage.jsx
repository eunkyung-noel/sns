import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import api from '../api/api';

// 배지 흔들림 효과 애니메이션
const bubbleShake = keyframes`
  0%, 100% { border-radius: 60% 40% 70% 30% / 40% 50% 60% 50%; }
  50% { border-radius: 40% 60% 30% 70% / 50% 40% 50% 60%; }
`;

const MessageListPage = () => {
    const [rooms, setRooms] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/dm/rooms')
            .then(res => { setRooms(res.data); })
            .catch(err => console.error("목록 로드 실패:", err));
    }, []);

    const handleSearch = async (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        if (val.trim()) {
            try {
                const res = await api.get(`/dm/search?term=${val}`);
                setSearchResults(res.data);
            } catch (err) {
                console.error("검색 실패", err);
            }
        } else {
            setSearchResults([]);
        }
    };

    return (
        <Container>
            <Header>🫧 메시지 비눗방울</Header>
            <SearchBox>
                <Input placeholder="대화할 상대를 검색하세요..." value={searchTerm} onChange={handleSearch} />
                {searchResults.length > 0 && (
                    <Dropdown>
                        {searchResults.map(u => (
                            <Item key={u.id} onClick={() => navigate(`/dm/${u.id}`)}>
                                <UserSearchInfo>
                                    <div className="name-row">
                                        <span className="nickname">{u.nickname}</span>
                                        {/* ✅ 텍스트 없이 아이콘 물방울만 표시 */}
                                        <IconBadge $isAdult={u.isAdult}>
                                            {u.isAdult ? '🐳' : '🐠'}
                                        </IconBadge>
                                    </div>
                                    <span className="email">{u.email}</span>
                                </UserSearchInfo>
                            </Item>
                        ))}
                    </Dropdown>
                )}
            </SearchBox>

            <List>
                {rooms.length === 0 ? (
                    <EmptyMsg>진행 중인 대화가 없습니다.</EmptyMsg>
                ) : (
                    rooms.map((r, idx) => (
                        <Card key={r.opponent?.id || idx} onClick={() => navigate(`/dm/${r.opponent.id}`)}>
                            <div style={{ flex: 1 }}>
                                <Name>{r.opponent?.nickname || "알 수 없는 사용자"}</Name>
                                <Last>{r.lastMessage}</Last>
                            </div>
                            {!r.isRead && <UnreadBadge />}
                        </Card>
                    ))
                )}
            </List>
        </Container>
    );
};

export default MessageListPage;

/* ===== 스타일 정의 (텍스트 제거 및 아이콘 강조) ===== */
const Container = styled.div` max-width: 500px; margin: auto; padding: 20px; `;
const Header = styled.h1` text-align: center; color: #74b9ff; font-size: 24px; font-weight: 900; `;
const SearchBox = styled.div` position: relative; margin-bottom: 25px; `;
const Input = styled.input` width: 100%; padding: 14px 20px; border-radius: 30px; border: 1.5px solid #74b9ff22; background: #f8fbff; outline: none; transition: 0.3s; &:focus { border-color: #74b9ff; box-shadow: 0 0 10px rgba(116, 185, 255, 0.1); } `;

const Dropdown = styled.div` position: absolute; top: 60px; width: 100%; background: white; border-radius: 20px; border: 1.5px solid #e1f5fe; z-index: 100; box-shadow: 0 15px 35px rgba(0,0,0,0.1); overflow: hidden; `;

const Item = styled.div` padding: 15px 20px; cursor: pointer; transition: 0.2s; border-bottom: 1px solid #f8fbff; &:hover { background: #f0f8ff; } &:last-child { border-bottom: none; } `;

const UserSearchInfo = styled.div`
    display: flex; flex-direction: column; gap: 3px;
    .name-row { display: flex; align-items: center; gap: 8px; }
    .nickname { font-weight: 800; color: #2d3436; font-size: 15px; }
    .email { font-size: 11px; color: #b2bec3; }
`;

// ✅ 텍스트 없는 순수 아이콘 물방울 배지 스타일
const IconBadge = styled.div`
    width: 28px;
    height: 28px;
    background: white;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 15px;
    /* 이미지와 동일한 입체감 및 색상 테두리 */
    border: 2px solid ${p => p.$isAdult ? '#74b9ff' : '#ff7675'};
    box-shadow: 0 3px 8px ${p => p.$isAdult ? 'rgba(116, 185, 255, 0.3)' : 'rgba(255, 118, 117, 0.3)'};
    animation: ${bubbleShake} 3s ease-in-out infinite;
`;

const List = styled.div` display: flex; flex-direction: column; gap: 10px; `;
const Card = styled.div` background: white; padding: 18px; border-radius: 20px; cursor: pointer; display: flex; align-items: center; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #f1f2f6; transition: 0.2s; &:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.06); } `;
const Name = styled.div` font-weight: 800; color: #2d3436; `;
const Last = styled.div` font-size: 13px; color: #888; margin-top: 5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; `;
const UnreadBadge = styled.div` width: 10px; height: 10px; background: #ff7675; border-radius: 50%; margin-left: 10px; `;
const EmptyMsg = styled.div` text-align: center; color: #bbb; margin-top: 50px; font-weight: 500; `;