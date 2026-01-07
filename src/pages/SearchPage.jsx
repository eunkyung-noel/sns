import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const floatUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

// 물방울이 살짝 흔들리는 효과
const bubbleShake = keyframes`
  0%, 100% { border-radius: 60% 40% 70% 30% / 40% 50% 60% 50%; }
  50% { border-radius: 40% 60% 30% 70% / 50% 40% 50% 60%; }
`;

const SearchPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSearch = async () => {
        if (!searchTerm.trim()) { setUsers([]); return; }
        setLoading(true);
        try {
            const res = await api.get(`/dm/search?term=${encodeURIComponent(searchTerm)}`);
            setUsers(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('검색 실패:', err);
            setUsers([]);
        } finally { setLoading(false); }
    };

    useEffect(() => {
        const debounce = setTimeout(handleSearch, 300);
        return () => clearTimeout(debounce);
    }, [searchTerm]);

    const toggleFollow = async (e, userId) => {
        e.stopPropagation();
        try {
            const res = await api.post(`/users/follow/${userId}`);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isFollowing: res.data.isFollowing } : u));
        } catch (err) { console.error('팔로우 실패'); }
    };

    return (
        <FullContainer>
            <FixedHeader>
                <HeaderContent>
                    <Title>🫧 친구 찾기</Title>
                    <SearchInputWrapper>
                        <span className="icon">🔍</span>
                        <input
                            placeholder="이름이나 이메일로 친구를 찾아보세요!"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </SearchInputWrapper>
                </HeaderContent>
            </FixedHeader>

            <ScrollArea>
                <ResultList>
                    {users.map(user => (
                        <UserCard key={user.id} onClick={() => navigate(`/profile/${user.id}`)}>
                            <UserInfo>
                                <Avatar>{(user.nickname || 'U')[0].toUpperCase()}</Avatar>
                                <div className="user-text">
                                    <div className="name-row">
                                        <p className="name">{user.nickname}</p>
                                        {/* ✅ 물방울 배지 적용 */}
                                        <BubbleBadge $isAdult={user.isAdult}>
                                            {user.isAdult ? '🐳' : '🐠'}
                                        </BubbleBadge>
                                    </div>
                                    <p className="sub">{user.email}</p>
                                </div>
                            </UserInfo>
                            <FollowButton
                                $isFollowing={user.isFollowing}
                                onClick={(e) => toggleFollow(e, user.id)}
                            >
                                {user.isFollowing ? '팔로잉' : '팔로우'}
                            </FollowButton>
                        </UserCard>
                    ))}
                    {!loading && searchTerm && users.length === 0 && <EmptyMsg> 🫧🫧찾고 있는 친구가 없어요 🫧🫧</EmptyMsg>}
                    {loading && <EmptyMsg>... 🫧</EmptyMsg>}
                </ResultList>
            </ScrollArea>
        </FullContainer>
    );
};

export default SearchPage;

/* ===== 스타일 컴포넌트 ===== */
const FullContainer = styled.div` width: 100%; min-height: 100vh; background: #f0faff; `;
const FixedHeader = styled.div` position: fixed; top: 0; width: 100%; height: 130px; background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); border-bottom: 2px solid #e1f5fe; display: flex; justify-content: center; align-items: center; z-index: 1000; `;
const HeaderContent = styled.div` width: 100%; max-width: 500px; padding: 20px; `;
const Title = styled.h2` text-align: center; color: #74b9ff; font-size: 20px; font-weight: 900; `;
const SearchInputWrapper = styled.div` display: flex; align-items: center; background: #ffffff; border: 2px solid #e1f5fe; padding: 10px 18px; border-radius: 30px; input { flex: 1; border: none; background: transparent; outline: none; font-size: 15px; } .icon { margin-right: 10px; color: #74b9ff; } `;
const ScrollArea = styled.div` padding-top: 150px; display: flex; justify-content: center; `;
const ResultList = styled.div` width: 100%; max-width: 500px; padding: 0 20px 40px; `;
const UserCard = styled.div` background: white; padding: 15px; border-radius: 25px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; cursor: pointer; animation: ${floatUp} 0.4s ease-out; box-shadow: 0 8px 20px rgba(116, 185, 255, 0.1); `;
const UserInfo = styled.div` display: flex; align-items: center; gap: 15px; .name-row { display: flex; align-items: center; gap: 8px; } .name { font-weight: 800; color: #2d3436; margin: 0; } .sub { font-size: 12px; color: #b2bec3; margin: 0; } `;

const Avatar = styled.div` 
    width: 48px; height: 48px; 
    background: linear-gradient(135deg, #e1f0ff 0%, #74b9ff 100%); 
    border-radius: 50%; display: flex; justify-content: center; align-items: center; 
    color: white; font-weight: bold; font-size: 18px; box-shadow: 0 4px 10px rgba(116, 185, 255, 0.3);
`;

// ✅ 물방울 배지 스타일 (Bubble Concept)
const BubbleBadge = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 32px;
    height: 32px;
    font-size: 16px;
    background: ${props => props.$isAdult ? 'rgba(116, 185, 255, 0.2)' : 'rgba(255, 118, 117, 0.1)'};
    border: 2px solid ${props => props.$isAdult ? '#74b9ff' : '#ff7675'};
    border-radius: 60% 40% 70% 30% / 40% 50% 60% 50%; /* 유기적인 물방울 모양 */
    animation: ${bubbleShake} 4s ease-in-out infinite;
    box-shadow: inset 2px 2px 5px rgba(255, 255, 255, 0.5);
`;

const FollowButton = styled.button` border: none; padding: 8px 20px; border-radius: 20px; font-size: 12px; font-weight: 800; cursor: pointer; background: ${p => (p.$isFollowing ? '#f1f2f6' : '#74b9ff')}; color: ${p => (p.$isFollowing ? '#b2bec3' : 'white')}; transition: 0.3s; box-shadow: ${p => p.$isFollowing ? 'none' : '0 4px 12px rgba(116, 185, 255, 0.3)'}; &:active { transform: scale(0.95); } `;
const EmptyMsg = styled.div` text-align: center; margin-top: 60px; color: #74b9ff; font-weight: 800; font-size: 16px; `;