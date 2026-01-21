import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const SearchPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

    // 이미지 URL 처리 함수 최적화
    const getFullImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const baseUrl = SERVER_URL.endsWith('/') ? SERVER_URL.slice(0, -1) : SERVER_URL;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${baseUrl}${cleanPath}`;
    };

    const handleSearch = async () => {
        // [Fact] 공백만 있을 경우 검색 방지
        const term = searchTerm.trim();
        if (!term) {
            setUsers([]);
            return;
        }

        setLoading(true);
        try {
            const res = await api.get(`/dm/search?term=${encodeURIComponent(term)}`);
            setUsers(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("검색 실패:", err);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    // 데바운스 (타이핑 멈춘 후 400ms 뒤 실행)
    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch();
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const toggleFollow = async (e, userId) => {
        e.stopPropagation();
        try {
            const res = await api.post(`/users/follow/${userId}`);
            // [Fact] 현재 검색 리스트 내의 유저 상태만 변경하여 리렌더링 유도
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, isFollowing: res.data.isFollowing } : u
            ));
        } catch (err) {
            console.error("팔로우 처리 실패:", err);
        }
    };

    return (
        <PageBackground>
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
                        {loading && <SmallLoader />}
                    </SearchBar>
                </HeaderSection>

                <ResultGrid>
                    {users.length > 0 ? (
                        users.map(user => (
                            <UserCard key={user.id} onClick={() => navigate(`/profile/${user.id}`)}>
                                <UserInfo>
                                    {user.profilePic ? (
                                        <AvatarImg
                                            src={getFullImageUrl(user.profilePic)}
                                            alt="profile"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = `https://ui-avatars.com/api/?name=${user.nickname}&background=d0ebff&color=74c0fc`;
                                            }}
                                        />
                                    ) : (
                                        <AvatarDefault>{(user.nickname || 'U')[0].toUpperCase()}</AvatarDefault>
                                    )}
                                    <UserDetail>
                                        <div className="name-row">
                                            <span className="name">@{user.nickname}</span>
                                            <BubbleBadge $isAdult={user.isAdult}>
                                                {user.isAdult ? '🐋' : '🐠'}
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
                        ))
                    ) : (
                        // [Fact] 검색어가 있는데 결과가 없을 때만 표시
                        searchTerm.trim() && !loading && (
                            <EmptyResult>
                                <span className="icon">🫧</span>
                                <p>검색 결과가 없습니다.</p>
                            </EmptyResult>
                        )
                    )}
                </ResultGrid>
            </Container>
        </PageBackground>
    );
};

/* --- 스타일 (기존 코드 유지 및 일부 보강) --- */

const spin = keyframes` to { transform: rotate(360deg); } `;
const SmallLoader = styled.div`
    width: 20px; height: 20px;
    border: 3px solid #f0f9ff;
    border-top-color: #74c0fc;
    border-radius: 50%;
    animation: ${spin} 0.8s linear infinite;
`;

const EmptyResult = styled.div`
    grid-column: 1 / -1;
    text-align: center;
    padding: 100px 0;
    color: #a5d8ff;
    .icon { font-size: 40px; display: block; margin-bottom: 10px; }
    p { font-weight: 800; font-size: 18px; margin: 0; }
`;

const floatUp = keyframes` from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } `;
const bubbleShake = keyframes` 0%, 100% { border-radius: 60% 40% 70% 30% / 40% 50% 60% 50%; } 50% { border-radius: 40% 60% 30% 70% / 50% 40% 50% 60%; } `;
const PageBackground = styled.div` width: 100%; min-height: 100vh; background-color: #f0f9ff; `;
const Container = styled.div` max-width: 900px; margin: 0 auto; padding: 60px 20px; `;
const HeaderSection = styled.div` display: flex; flex-direction: column; align-items: center; gap: 30px; margin-bottom: 50px; text-align: center; `;
const TitleCol = styled.div` display: flex; flex-direction: column; gap: 8px; `;
const Title = styled.h2` margin: 0; font-size: 38px; font-weight: 900; color: #4dabf7; `;
const SubTitle = styled.span` font-size: 16px; color: #a5d8ff; `;
const SearchBar = styled.div` width: 100%; max-width: 600px; display: flex; align-items: center; background: white; padding: 18px 30px; border-radius: 25px; box-shadow: 0 10px 30px rgba(165, 216, 255, 0.15); border: 2px solid #d0ebff; .icon { font-size: 20px; margin-right: 15px; color: #74c0fc; } input { flex: 1; border: none; outline: none; font-size: 18px; color: #495057; } `;
const ResultGrid = styled.div` display: grid; grid-template-columns: 1fr 1fr; gap: 20px; @media (max-width: 768px) { grid-template-columns: 1fr; } `;
const UserCard = styled.div` background: white; padding: 25px; border-radius: 30px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; animation: ${floatUp} 0.4s ease-out; border: 1px solid #e7f5ff; transition: 0.2s; &:hover { transform: translateY(-5px); border-color: #74c0fc; } `;
const UserInfo = styled.div` display: flex; align-items: center; gap: 15px; `;
const AvatarImg = styled.img` width: 55px; height: 55px; border-radius: 50%; object-fit: cover; border: 2px solid #74c0fc; `;
const AvatarDefault = styled.div` width: 55px; height: 55px; background: linear-gradient(135deg, #d0ebff 0%, #74c0fc 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 20px; `;
const UserDetail = styled.div` display: flex; flex-direction: column; gap: 4px; .name-row { display: flex; align-items: center; gap: 8px; } .name { font-size: 17px; font-weight: 800; color: #495057; } .email { font-size: 13px; color: #a5d8ff; } `;
const BubbleBadge = styled.div` display: flex; justify-content: center; align-items: center; width: 28px; height: 28px; font-size: 14px; background: white; border: 2px solid ${props => props.$isAdult ? '#74c0fc' : '#63e6be'}; border-radius: 60% 40% 70% 30% / 40% 50% 60% 50%; animation: ${bubbleShake} 4s ease-in-out infinite; `;
const ActionArea = styled.div` display: flex; align-items: center; `;
const FollowButton = styled.button` border: none; padding: 10px 22px; border-radius: 15px; font-size: 14px; font-weight: 800; cursor: pointer; transition: 0.3s; background: ${p => (p.$isFollowing ? '#f1f3f5' : '#74c0fc')}; color: ${p => (p.$isFollowing ? '#adb5bd' : 'white')}; `;

export default SearchPage;