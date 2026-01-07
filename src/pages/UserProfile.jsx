import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import api from '../api/api';

const UserProfile = () => {
    const { userId } = useParams();
    const [userData, setUserData] = useState(null);
    const [posts, setPosts] = useState([]);
    const SERVER_URL = 'http://localhost:5001';

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await api.get(`/users/${userId}`);
                setUserData(res.data.user);

                // 비공개 계정이 아니고, 내가 차단당하지 않았을 때만 게시글 로드
                if (res.data.user.isPrivate !== 1) {
                    const postRes = await api.get(`/posts/user/${userId}`);
                    setPosts(postRes.data);
                }
            } catch (err) {
                console.error("사용자 정보 로드 실패");
            }
        };
        fetchUserData();
    }, [userId]);

    if (!userData) return <Loading>사용자를 찾는 중... 🫧</Loading>;

    return (
        <Container>
            <ProfileHeader>
                <Avatar src={userData.profilePic ? `${SERVER_URL}${userData.profilePic}` : `https://ui-avatars.com/api/?name=${userData.nickname}`} />
                <UserInfo>
                    <NameRow>
                        <Nickname>@{userData.nickname}</Nickname>
                        {/* 성인/미자 아이콘 */}
                        <AgeIcon>{userData.age >= 19 ? '🐳' : '🐠'}</AgeIcon>
                    </NameRow>
                    <StatRow>
                        <StatItem>게시물 <b>{posts.length}</b></StatItem>
                        <StatItem>팔로워 <b>{userData._count?.followers || 0}</b></StatItem>
                        <StatItem>팔로잉 <b>{userData._count?.following || 0}</b></StatItem>
                    </StatRow>
                    <Bio>{userData.bio || "소개가 없습니다."}</Bio>
                </UserInfo>
            </ProfileHeader>

            <ContentArea>
                {userData.isPrivate === 1 ? (
                    <PrivateMsg>
                        <LockIcon>🔒</LockIcon>
                        <p>비공개 계정입니다.</p>
                        <span>팔로우를 맺어야 게시글을 볼 수 있습니다.</span>
                    </PrivateMsg>
                ) : (
                    <PostGrid>
                        {posts.map(p => (
                            <PostThumb key={p.id} src={`${SERVER_URL}${p.imageUrl}`} />
                        ))}
                    </PostGrid>
                )}
            </ContentArea>
        </Container>
    );
};

export default UserProfile;

// 스타일 생략 (기존 MyPage와 유사하게 적용)
const Container = styled.div` max-width: 600px; margin: 0 auto; padding: 20px; `;
const ProfileHeader = styled.div` display: flex; gap: 30px; align-items: center; margin-bottom: 40px; `;
const Avatar = styled.img` width: 100px; height: 100px; border-radius: 50%; object-fit: cover; `;
const UserInfo = styled.div` flex: 1; `;
const NameRow = styled.div` display: flex; align-items: center; gap: 10px; margin-bottom: 10px; `;
const Nickname = styled.h3` margin: 0; font-size: 20px; `;
const AgeIcon = styled.span` font-size: 20px; `;
const StatRow = styled.div` display: flex; gap: 20px; margin-bottom: 15px; `;
const StatItem = styled.div` font-size: 14px; b { color: #1a2a6c; } `;
const Bio = styled.p` font-size: 14px; color: #666; `;
const ContentArea = styled.div` border-top: 1px solid #eee; padding-top: 20px; `;
const PrivateMsg = styled.div` text-align: center; padding: 50px 0; color: #999; `;
const LockIcon = styled.div` font-size: 40px; margin-bottom: 10px; `;
const PostGrid = styled.div` display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; `;
const PostThumb = styled.img` width: 100%; aspect-ratio: 1/1; object-fit: cover; `;
const Loading = styled.div` text-align: center; margin-top: 100px; `;