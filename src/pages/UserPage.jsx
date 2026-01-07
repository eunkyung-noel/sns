import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../api/api';
import Swal from 'sweetalert2';

const UserPage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const myId = String(localStorage.getItem('userId') || '');
    const SERVER_URL = 'http://localhost:5001';

    const fetchUserData = async () => {
        try {
            // 1. 유저 기본 정보 및 팔로우 상태 가져오기
            const res = await api.get(`/users/${userId}`);
            setUserInfo(res.data);

            // 2. 비공개 계정이 아니거나, 이미 팔로우 중이거나, 본인인 경우에만 게시글 로드
            if (!res.data.isPrivate || res.data.isFollowing || userId === myId) {
                const postsRes = await api.get(`/posts/user/${userId}`);
                setUserPosts(postsRes.data || []);
            }
        } catch (err) {
            Swal.fire('에러', '사용자를 찾을 수 없습니다.', 'error');
            navigate(-1);
        }
    };

    useEffect(() => { fetchUserData(); }, [userId]);

    const handleFollow = async () => {
        try {
            await api.post(`/users/${userId}/follow`);
            fetchUserData(); // 팔로우 후 데이터 갱신
        } catch (err) {
            Swal.fire('실패', '팔로우 처리에 오류가 발생했습니다.', 'error');
        }
    };

    if (!userInfo) return <Loading>사용자 정보를 불러오는 중...</Loading>;

    return (
        <Container>
            <Header>
                <BackBtn onClick={() => navigate(-1)}>←</BackBtn>
                <Title>@{userInfo.nickname}의 피드</Title>
            </Header>

            <ProfileCard>
                <ProfileImg src={userInfo.profileImage ? `${SERVER_URL}${userInfo.profileImage}` : 'https://via.placeholder.com/100'} />
                <NameRow>
                    <UserName>@{userInfo.nickname}</UserName>
                    <AgeBadge isAdult={userInfo.isAdult}>
                        {userInfo.isAdult ? '성인' : '미자'}
                    </AgeBadge>
                </NameRow>

                <StatRow>
                    <StatItem><b>{userInfo.followerCount || 0}</b> 팔로워</StatItem>
                    <StatItem><b>{userInfo.followingCount || 0}</b> 팔로잉</StatItem>
                </StatRow>

                {userId !== myId && (
                    <FollowBtn onClick={handleFollow} isFollowing={userInfo.isFollowing}>
                        {userInfo.isFollowing ? '팔로잉' : '팔로우 하기'}
                    </FollowBtn>
                )}
            </ProfileCard>

            <PostGrid>
                {userInfo.isPrivate && !userInfo.isFollowing && userId !== myId ? (
                    <PrivateOverlay>
                        <LockIcon>🔒</LockIcon>
                        <PrivateText>비공개 계정입니다.</PrivateText>
                        <SubText>사진과 동영상을 보려면 팔로우하세요.</SubText>
                    </PrivateOverlay>
                ) : (
                    userPosts.map(post => (
                        <PostThumb key={post.id}>
                            {post.imageUrl ? (
                                <ThumbImg src={`${SERVER_URL}${post.imageUrl}`} />
                            ) : (
                                <TextThumb>{post.content.substring(0, 20)}...</TextThumb>
                            )}
                        </PostThumb>
                    ))
                )}
            </PostGrid>
        </Container>
    );
};

// --- Styled Components ---
const Container = styled.div` max-width: 500px; margin: auto; padding: 20px; background: #fff; min-height: 100vh; `;
const Header = styled.div` display: flex; align-items: center; margin-bottom: 25px; `;
const BackBtn = styled.button` background:none; border:none; font-size: 20px; cursor:pointer; `;
const Title = styled.h2` flex:1; text-align: center; font-size: 16px; margin-right: 25px; `;
const ProfileCard = styled.div` text-align: center; margin-bottom: 30px; `;
const ProfileImg = styled.img` width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 2px solid #f0f2f5; `;
const NameRow = styled.div` display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 15px; `;
const UserName = styled.span` font-weight: 700; font-size: 18px; `;
const AgeBadge = styled.span` background: ${props => props.isAdult ? '#ff4757' : '#74b9ff'}; color: white; padding: 2px 8px; border-radius: 5px; font-size: 12px; `;
const StatRow = styled.div` display: flex; justify-content: center; gap: 30px; margin: 20px 0; `;
const StatItem = styled.div` font-size: 14px; color: #636e72; b { color: #2d3436; } `;
const FollowBtn = styled.button` width: 80%; padding: 10px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; background: ${props => props.isFollowing ? '#f1f2f6' : '#74b9ff'}; color: ${props => props.isFollowing ? '#2d3436' : '#white'}; `;
const PostGrid = styled.div` display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; border-top: 1px solid #f1f2f6; padding-top: 10px; `;
const PostThumb = styled.div` aspect-ratio: 1/1; background: #f8f9fa; overflow: hidden; display: flex; align-items: center; justify-content: center; `;
const ThumbImg = styled.img` width: 100%; height: 100%; object-fit: cover; `;
const TextThumb = styled.p` font-size: 10px; color: #b2bec3; padding: 5px; text-align: center; `;
const PrivateOverlay = styled.div` grid-column: span 3; text-align: center; padding: 60px 20px; color: #636e72; `;
const LockIcon = styled.div` font-size: 40px; margin-bottom: 15px; `;
const PrivateText = styled.p` font-weight: 700; font-size: 16px; margin-bottom: 5px; `;
const SubText = styled.p` font-size: 13px; `;
const Loading = styled.div` text-align: center; margin-top: 100px; color: #74b9ff; `;

export default UserPage;