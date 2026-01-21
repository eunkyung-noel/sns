import React, { useEffect, useState } from 'react';
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

    const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

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
        <PageBackground>
            <Container>
                <HeaderWrapper>
                    <Header>Messages 🫧</Header>
                    <SubTitle>소중한 사람들과 대화를 나눠보세요.</SubTitle>
                </HeaderWrapper>

                <SearchContainer>
                    <SearchInputWrapper>
                        <SearchIcon>🔍</SearchIcon>
                        <Input
                            placeholder="대화할 상대를 검색하세요..."
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </SearchInputWrapper>

                    {searchResults.length > 0 && (
                        <Dropdown>
                            {searchResults.map(u => (
                                <Item key={u.id} onClick={() => navigate(`/dm/${u.id}`)}>
                                    <UserSearchInfo>
                                        <div className="name-row">
                                            <span className="nickname">@{u.nickname}</span>
                                            <IconBadge $isAdult={u.isAdult}>
                                                {u.isAdult ? '🐳' : '🐠'}
                                            </IconBadge>
                                        </div>
                                        <span className="email">{u.email}</span>
                                    </UserSearchInfo>
                                    <DirectBtn>대화하기</DirectBtn>
                                </Item>
                            ))}
                        </Dropdown>
                    )}
                </SearchContainer>

                <ListSection>
                    {rooms.length === 0 ? (
                        <EmptyMsg>진행 중인 대화가 없습니다. 🫧</EmptyMsg>
                    ) : (
                        rooms.map((r, idx) => (
                            <Card key={r.opponent?.id || idx} onClick={() => navigate(`/dm/${r.opponent.id}`)}>
                                <AvatarWrapper>
                                    {r.opponent?.profilePic ? (
                                        <AvatarImg src={`${SERVER_URL}${r.opponent.profilePic}`} />
                                    ) : (
                                        <DefaultAvatar>👤</DefaultAvatar>
                                    )}
                                </AvatarWrapper>

                                <ContentSection>
                                    <NameRow>
                                        <NameArea>
                                            <Name>{r.opponent?.nickname || "알 수 없는 사용자"}</Name>
                                            <IconBadge $isAdult={r.opponent?.isAdult} $small>
                                                {r.opponent?.isAdult ? '🐳' : '🐠'}
                                            </IconBadge>
                                        </NameArea>
                                        <TimeText>
                                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '방금 전'}
                                        </TimeText>
                                    </NameRow>
                                    <Last>{r.lastMessage}</Last>
                                </ContentSection>

                                {!r.isRead && <UnreadIndicator />}
                            </Card>
                        ))
                    )}
                </ListSection>
            </Container>
        </PageBackground>
    );
};

/* ===== 스타일 정의 ===== */

const PageBackground = styled.div`
    width: 100%;
    min-height: 100vh;
    background-color: #f0f9ff; /* [수정] 맑은 연하늘색 배경 */
`;

const Container = styled.div` max-width: 900px; margin: 0 auto; padding: 60px 30px; `;

const HeaderWrapper = styled.div` margin-bottom: 40px; text-align: left; `;
const Header = styled.h1` color: #4dabf7; font-size: 36px; font-weight: 900; margin: 0; `; /* [수정] 색상 톤 조정 */
const SubTitle = styled.p` color: #a5d8ff; font-size: 16px; margin-top: 10px; `;

const SearchContainer = styled.div` position: relative; margin-bottom: 40px; `;
const SearchInputWrapper = styled.div` position: relative; display: flex; align-items: center; `;
const SearchIcon = styled.span` position: absolute; left: 20px; font-size: 20px; color: #74c0fc; `;

const Input = styled.input`
    width: 100%; padding: 20px 20px 20px 55px; border-radius: 20px;
    border: 2px solid #d0ebff; background: white; font-size: 17px; outline: none;
    transition: all 0.3s; box-shadow: 0 4px 15px rgba(165, 216, 255, 0.1);
    &::placeholder { color: #d0ebff; }
    &:focus { border-color: #74c0fc; box-shadow: 0 10px 25px rgba(116, 192, 252, 0.15); }
`;

const Dropdown = styled.div`
    position: absolute; top: 75px; width: 100%; background: white; border-radius: 20px;
    z-index: 1000; box-shadow: 0 20px 40px rgba(165, 216, 255, 0.15); border: 1px solid #e7f5ff; overflow: hidden;
`;

const Item = styled.div`
    padding: 20px 30px; cursor: pointer; display: flex; justify-content: space-between;
    align-items: center; border-bottom: 1px solid #f8fbff;
    &:hover { background: #f0f9ff; } &:last-child { border-bottom: none; }
`;

const UserSearchInfo = styled.div`
    display: flex; flex-direction: column; gap: 5px;
    .name-row { display: flex; align-items: center; gap: 10px; }
    .nickname { font-weight: 800; color: #495057; font-size: 17px; }
    .email { font-size: 13px; color: #a5d8ff; }
`;

const DirectBtn = styled.button`
    background: #74c0fc; color: white; border: none; padding: 8px 16px;
    border-radius: 10px; font-weight: bold; cursor: pointer;
    &:hover { background: #4dabf7; }
`;

const IconBadge = styled.div`
    width: ${p => p.$small ? '24px' : '32px'};
    height: ${p => p.$small ? '24px' : '32px'};
    background: white;
    border-radius: 50%;
    display: flex; justify-content: center; align-items: center;
    font-size: ${p => p.$small ? '13px' : '18px'};
    border: 2px solid ${p => p.$isAdult ? '#74c0fc' : '#63e6be'}; /* [수정] 연두색 톤 조정 */
    box-shadow: 0 4px 10px rgba(0,0,0,0.03);
    animation: ${bubbleShake} 3s ease-in-out infinite;
    flex-shrink: 0;
`;

const ListSection = styled.div` display: flex; flex-direction: column; gap: 15px; `;

const Card = styled.div`
    background: white; padding: 25px 35px; border-radius: 25px; cursor: pointer;
    display: flex; align-items: center; gap: 20px; box-shadow: 0 4px 15px rgba(165, 216, 255, 0.05);
    border: 1px solid #e7f5ff; transition: all 0.3s;
    &:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(165, 216, 255, 0.15); border-color: #74c0fc; }
`;

const AvatarWrapper = styled.div`
    width: 60px; height: 60px; border-radius: 50%; background: #f1f3f5;
    overflow: hidden; display: flex; justify-content: center; align-items: center;
    border: 1px solid #e7f5ff;
`;

const AvatarImg = styled.img` width: 100%; height: 100%; object-fit: cover; `;
const DefaultAvatar = styled.span` font-size: 28px; `;

const ContentSection = styled.div` flex: 1; overflow: hidden; `;
const NameRow = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; `;
const NameArea = styled.div` display: flex; align-items: center; gap: 8px; `;
const Name = styled.div` font-weight: 800; color: #495057; font-size: 18px; `;
const TimeText = styled.span` font-size: 12px; color: #a5d8ff; `;

const Last = styled.div`
    font-size: 15px; color: #868e96; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
`;

const UnreadIndicator = styled.div`
    width: 12px; height: 12px; background: #74c0fc; border-radius: 50%;
    box-shadow: 0 0 10px rgba(116, 192, 252, 0.5);
`;

const EmptyMsg = styled.div` text-align: center; color: #a5d8ff; padding: 100px 0; font-size: 18px; font-weight: 700; `;

export default MessageListPage;