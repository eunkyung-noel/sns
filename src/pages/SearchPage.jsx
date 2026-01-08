import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import Swal from 'sweetalert2';

const floatUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

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
            // [Fact] 백엔드 GET /api/dm/search 호출
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
        e.stopPropagation(); // 카드 클릭(프로필 이동) 이벤트 전파 방지
        try {
            const res = await api.post(`/users/follow/${userId}`);
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, isFollowing: res.data.isFollowing } : u
            ));

            Swal.fire({
                title: res.data.isFollowing ? '팔로우 시작!' : '언팔로우 완료',
                icon: 'success',
                timer: 1000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        } catch (err) {
            Swal.fire('오류', '처리에 실패했습니다.', 'error');
        }
    };

    return (
        <Container>
            <HeaderSection>
                <TitleCol>
                    <Title>🫧 친구 찾기</Title>
                    <SubTitle>이름이나 이메일로 새로운 인연을 찾아보세요.</SubTitle>
                </TitleCol>
                <SearchBar>
                    <span className="icon">🔍</span>
                    <input
                        placeholder="누구를 찾고 계신가요?"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </SearchBar>
            </HeaderSection>

            <ResultGrid>
                {users.map(user => (
                    <UserCard key={user.id} onClick={() => navigate(`/profile/${user.id}`)}>
                        <UserInfo>
                            <Avatar>{(user.nickname || 'U')[0].toUpperCase()}</Avatar>
                            <UserDetail>
                                <div className="name-row">
                                    <span className="name">{user.nickname}</span>
                                    <BubbleBadge $isAdult={user.isAdult}>
                                        {user.isAdult ? '🐳' : '🐠'}
                                    </BubbleBadge>
                                </div>
                                <span className="email">{user.email}</span>
                            </UserDetail>
                        </UserInfo>
                        <ActionArea>
                            <FollowButton
                                $isFollowing={user.isFollowing}
                                onClick={(e) => toggleFollow(e, user.id)}
                            >
                                {user.isFollowing ? '팔로잉' : '팔로우'}
                            </FollowButton>
                        </ActionArea>
                    </UserCard>
                ))}
            </ResultGrid>

            {!loading && searchTerm && users.length === 0 && (
                <EmptyState>
                    <div className="icon">🫧</div>
                    <p>찾고 있는 친구가 버블 안에 없어요.</p>
                </EmptyState>
            )}

            {loading && <EmptyState><p>버블 속을 탐색 중... 🫧</p></EmptyState>}
        </Container>
    );
};

/* --- 스타일 정의: 와이드 웹 최적화 --- */

const Container = styled.div`
    max-width: 900px;
    margin: 40px auto;
    padding: 0 20px;
    min-height: 100vh;
`;

const HeaderSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 30px;
    margin-bottom: 50px;
    text-align: center;
`;

const TitleCol = styled.div` display: flex; flex-direction: column; gap: 8px; `;
const Title = styled.h2` margin: 0; font-size: 32px; font-weight: 900; color: #2d3436; `;
const SubTitle = styled.span` font-size: 16px; color: #b2bec3; `;

const SearchBar = styled.div`
    width: 100%;
    max-width: 600px;
    display: flex;
    align-items: center;
    background: white;
    padding: 15px 25px;
    border-radius: 20px;
    box-shadow: 0 10px 25px rgba(116, 185, 255, 0.1);
    border: 2px solid #f0f7ff;
    
    .icon { font-size: 20px; margin-right: 15px; color: #74b9ff; }
    input { 
        flex: 1; border: none; outline: none; font-size: 17px; color: #2d3436; 
        &::placeholder { color: #ccc; }
    }
    &:focus-within { border-color: #74b9ff; }
`;

const ResultGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr; /* 🔍 가로 2열 배치로 넓게 활용 */
    gap: 20px;
    @media (max-width: 768px) { grid-template-columns: 1fr; }
`;

const UserCard = styled.div`
    background: white;
    padding: 25px;
    border-radius: 25px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    animation: ${floatUp} 0.4s ease-out;
    border: 1px solid #f1f2f6;
    transition: all 0.2s;

    &:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 30px rgba(116, 185, 255, 0.15);
    }
`;

const UserInfo = styled.div` display: flex; align-items: center; gap: 15px; `;

const Avatar = styled.div`
    width: 55px; height: 55px;
    background: linear-gradient(135deg, #e1f0ff 0%, #74b9ff 100%);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: white; font-weight: 900; font-size: 20px;
    box-shadow: 0 4px 10px rgba(116, 185, 255, 0.3);
`;

const UserDetail = styled.div`
    display: flex; flex-direction: column; gap: 4px;
    .name-row { display: flex; align-items: center; gap: 8px; }
    .name { font-size: 17px; font-weight: 800; color: #2d3436; }
    .email { font-size: 13px; color: #b2bec3; }
`;

const BubbleBadge = styled.div`
    display: flex; justify-content: center; align-items: center;
    width: 28px; height: 28px; font-size: 14px;
    background: white;
    border: 2px solid ${props => props.$isAdult ? '#74b9ff' : '#ff7675'};
    border-radius: 60% 40% 70% 30% / 40% 50% 60% 50%;
    animation: ${bubbleShake} 4s ease-in-out infinite;
`;

const ActionArea = styled.div` display: flex; align-items: center; `;

const FollowButton = styled.button`
    border: none;
    padding: 10px 20px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
    transition: 0.3s;
    background: ${p => (p.$isFollowing ? '#f1f2f6' : '#74b9ff')};
    color: ${p => (p.$isFollowing ? '#b2bec3' : 'white')};
    
    &:hover {
        background: ${p => (p.$isFollowing ? '#e1e2e6' : '#1a2a6c')};
        color: white;
    }
`;

const EmptyState = styled.div`
    text-align: center; margin-top: 100px;
    .icon { font-size: 60px; margin-bottom: 20px; opacity: 0.5; }
    p { color: #74b9ff; font-weight: 800; font-size: 18px; }
`;

export default SearchPage;