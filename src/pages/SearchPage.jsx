import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const bubbleFloat = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
  100% { transform: translateY(0px); }
`;

const SearchPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();

    // 🔍 실시간 검색 로직 (입력값이 바뀔 때마다 실행)
    useEffect(() => {
        const fetchUsers = async () => {
            if (searchTerm.trim().length === 0) {
                setUsers([]);
                return;
            }

            try {
                const res = await axios.get(`http://localhost:5000/api/users/search?term=${searchTerm}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setUsers(res.data);
            } catch (err) {
                console.error('검색 중 오류 발생:', err);
            }
        };

        // 디바운싱: 타자 칠 때마다 서버에 요청 보내면 과부하 걸리므로 0.3초 대기
        const timeoutId = setTimeout(fetchUsers, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const toggleFollow = async (targetUserId, isFollowing) => {
        try {
            const method = isFollowing ? 'delete' : 'post';
            await axios({
                method,
                url: `http://localhost:5000/api/follow/${targetUserId}`,
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setUsers(users.map(user =>
                user.id === targetUserId ? { ...user, isFollowing: !isFollowing } : user
            ));
        } catch (err) {
            alert('팔로우 처리에 실패했습니다.');
        }
    };

    return (
        <Container>
            {/* 🫧 비눗방울 컨셉 검색바 영역 */}
            <SearchBoxSection>
                <SearchInputWrapper>
                    <SearchIcon>🔍</SearchIcon>
                    <SearchInput
                        type="text"
                        placeholder="찾고 싶은 친구의 이름을 적어봐!"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && <ClearBtn onClick={() => setSearchTerm('')}>✕</ClearBtn>}
                </SearchInputWrapper>
            </SearchBoxSection>

            {/* 검색 결과 리스트 */}
            <UserList>
                {users.length > 0 ? (
                    users.map(user => (
                        <UserCard key={user.id}>
                            <UserInfo onClick={() => navigate(`/profile/${user.id}`)}>
                                <Avatar>👤</Avatar>
                                <UserName>{user.name}</UserName>
                            </UserInfo>

                            <ActionArea>
                                <MsgBtn onClick={() => navigate(`/dm/${user.id}`)}>📩</MsgBtn>
                                <FollowBtn
                                    $isFollowing={user.isFollowing}
                                    onClick={() => toggleFollow(user.id, user.isFollowing)}
                                >
                                    {user.isFollowing ? '언팔로우' : '팔로우'}
                                </FollowBtn>
                            </ActionArea>
                        </UserCard>
                    ))
                ) : (
                    searchTerm && <NoResult>검색 결과가 없어 🫧</NoResult>
                )}
            </UserList>
        </Container>
    );
};

export default SearchPage;

/* 스타일링 */
const Container = styled.div` max-width: 500px; margin: 0 auto; padding: 20px; padding-bottom: 100px; `;

const SearchBoxSection = styled.div`
    position: sticky; top: 70px; background: white; padding: 10px 0; z-index: 10;
`;

const SearchInputWrapper = styled.div`
    display: flex; align-items: center; background: #f1f2f6;
    padding: 10px 18px; border-radius: 30px;
    box-shadow: inset 2px 2px 5px rgba(0,0,0,0.05);
    transition: 0.3s;
    &:focus-within { background: white; box-shadow: 0 5px 15px rgba(116, 185, 255, 0.2); border: 1.5px solid #74b9ff; }
`;

const SearchIcon = styled.span` margin-right: 10px; font-size: 18px; `;
const SearchInput = styled.input`
    flex: 1; border: none; background: transparent; outline: none; font-size: 15px;
`;
const ClearBtn = styled.button` border: none; background: none; cursor: pointer; color: #b2bec3; `;

const UserList = styled.div` margin-top: 15px; `;
const UserCard = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    padding: 15px; background: white; border-radius: 20px; margin-bottom: 12px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.03); animation: ${bubbleFloat} 4s ease-in-out infinite;
`;

const UserInfo = styled.div` display: flex; align-items: center; cursor: pointer; `;
const Avatar = styled.div` font-size: 28px; margin-right: 12px; `;
const UserName = styled.div` font-weight: 700; color: #2d3436; `;

const ActionArea = styled.div` display: flex; gap: 8px; `;
const MsgBtn = styled.button`
    background: #e3f2fd; border: none; padding: 10px; border-radius: 50%; cursor: pointer;
    font-size: 16px; transition: 0.2s;
    &:hover { transform: scale(1.1); background: #bbdefb; }
`;
const FollowBtn = styled.button`
    border: none; padding: 8px 16px; border-radius: 20px; font-weight: 800; cursor: pointer;
    background: ${p => p.$isFollowing ? '#f1f2f6' : '#74b9ff'};
    color: ${p => p.$isFollowing ? '#636e72' : 'white'};
    transition: 0.3s;
    &:hover { opacity: 0.9; transform: translateY(-2px); }
`;
const NoResult = styled.div` text-align: center; color: #b2bec3; margin-top: 50px; `;