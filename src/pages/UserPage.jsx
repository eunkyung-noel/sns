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
    const [loading, setLoading] = useState(true);

    const myId = String(localStorage.getItem('userId') || '');
    const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

    const fetchUserData = async () => {
        try {
            setLoading(true);
            // 1. 유저 기본 정보 및 팔로우 상태 가져오기
            const res = await api.get(`/users/${userId}`);
            setUserInfo(res.data);

            // 2. 비공개 계정이 아니거나, 이미 팔로우 중이거나, 본인인 경우에만 게시글 로드
            if (!res.data.isPrivate || res.data.isFollowing || userId === myId) {
                const postsRes = await api.get(`/posts/user/${userId}`);
                setUserPosts(postsRes.data || []);
            }
        } catch (err) {
            console.error(err);
            Swal.fire('에러', '사용자를 찾을 수 없거나 정보를 불러올 수 없습니다.', 'error');
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [userId]);

    const handleFollow = async () => {
        try {
            await api.post(`/users/${userId}/follow`);
            // 팔로우 성공 후 데이터 갱신 (팔로워 수 및 게시글 노출 여부 업데이트)
            fetchUserData();
        } catch (err) {
            Swal.fire('실패', '팔로우 처리에 오류가 발생했습니다.', 'error');
        }
    };

    if (loading) return <Loading>🫧 유저 정보를 탐색 중입니다...</Loading>;
    if (!userInfo) return <Loading>정보를 찾을 수 없습니다.</Loading>;

    return (
        <Container>
            <Header>
                <BackBtn onClick={() => navigate(-1)}>〈</BackBtn>
                <TitleCol>
                    <Title>@{userInfo.nickname}님의 피드</Title>
                    <SubTitle>버블에서 공유된 소중한 순간들</SubTitle>
                </TitleCol>
            </Header>

            <ProfileCard>
                <ProfileMain>
                    <Avatar
                        src={userInfo.profileImage
                            ? `${SERVER_URL}${userInfo.profileImage}`
                            : `https://ui-avatars.com/api/?name=${userInfo.nickname}&background=74b9ff&color=fff`}
                    />
                    <InfoCol>
                        <UserRow>
                            <UserName>@{userInfo.nickname}</UserName>
                            <AgeBadge $isAdult={userInfo.isAdult}>
                                {userInfo.isAdult ? '성인 🐳' : '미성년자 🐠'}
                            </AgeBadge>
                            {userId !== myId && (
                                <FollowBtn onClick={handleFollow} $isFollowing={userInfo.isFollowing}>
                                    {userInfo.isFollowing ? '팔로잉' : '팔로우'}
                                </FollowBtn>
                            )}
                        </UserRow>

                        <StatRow>
                            <StatItem>게시물 <b>{userPosts.length || 0}</b></StatItem>
                            <StatItem>팔로워 <b>{userInfo.followerCount || 0}</b></StatItem>
                            <StatItem>팔로잉 <b>{userInfo.followingCount || 0}</b></StatItem>
                        </StatRow>

                        <Bio>{userInfo.bio || "아직 작성된 소개글이 없습니다. 🫧"}</Bio>
                    </InfoCol>
                </ProfileMain>
            </ProfileCard>

            <ContentSection>
                <SectionHeader>
                    <span>POSTS</span>
                </SectionHeader>

                {userInfo.isPrivate && !userInfo.isFollowing && userId !== myId ? (
                    <PrivateOverlay>
                        <LockIcon>🔒</LockIcon>
                        <PrivateText>비공개 계정입니다.</PrivateText>
                        <PrivateSub>사진과 내용을 보려면 팔로우하세요.</PrivateSub>
                    </PrivateOverlay>
                ) : (
                    <PostGrid>
                        {userPosts.length > 0 ? (
                            userPosts.map(post => (
                                <PostThumb key={post.id} onClick={() => navigate(`/post/${post.id}`)}>
                                    {post.imageUrl ? (
                                        <ThumbImg src={`${SERVER_URL}${post.imageUrl}`} />
                                    ) : (
                                        <TextThumb>
                                            <p>{post.content}</p>
                                        </TextThumb>
                                    )}
                                    <ThumbOverlay className="overlay">
                                        <span>상세보기</span>
                                    </ThumbOverlay>
                                </PostThumb>
                            ))
                        ) : (
                            <EmptyFeed>아직 게시물이 없습니다.</EmptyFeed>
                        )}
                    </PostGrid>
                )}
            </ContentSection>
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

const Header = styled.div`
    display: flex; align-items: center; gap: 20px; 
    margin-bottom: 30px; padding-bottom: 25px;
    border-bottom: 2px solid #f0f7ff;
`;

const BackBtn = styled.button`
    background: #f1f2f6; border: none; width: 45px; height: 45px; 
    border-radius: 50%; font-size: 20px; cursor: pointer; color: #74b9ff;
    &:hover { background: #74b9ff; color: white; }
`;

const TitleCol = styled.div` display: flex; flex-direction: column; gap: 4px; `;
const Title = styled.h2` margin: 0; font-size: 26px; font-weight: 900; color: #2d3436; `;
const SubTitle = styled.span` font-size: 14px; color: #b2bec3; `;

const ProfileCard = styled.div`
    background: white; padding: 40px; border-radius: 30px;
    box-shadow: 0 10px 30px rgba(116, 185, 255, 0.08);
    border: 1px solid #f1f2f6; margin-bottom: 40px;
`;

const ProfileMain = styled.div` display: flex; align-items: center; gap: 50px; `;

const Avatar = styled.img`
    width: 150px; height: 150px; border-radius: 50%; object-fit: cover;
    border: 5px solid #f0f7ff; box-shadow: 0 5px 15px rgba(0,0,0,0.05);
`;

const InfoCol = styled.div` flex: 1; `;

const UserRow = styled.div` display: flex; align-items: center; gap: 15px; margin-bottom: 15px; `;
const UserName = styled.h1` margin: 0; font-size: 28px; font-weight: 900; color: #2d3436; `;

const AgeBadge = styled.span`
    background: ${props => props.$isAdult ? '#fff1f2' : '#f0f7ff'};
    color: ${props => props.$isAdult ? '#ff4757' : '#74b9ff'};
    padding: 4px 12px; border-radius: 8px; font-size: 12px; font-weight: 800;
`;

const FollowBtn = styled.button`
    margin-left: 10px; padding: 8px 20px; border-radius: 10px; border: none; font-weight: 800;
    cursor: pointer; transition: 0.2s;
    background: ${props => props.$isFollowing ? '#f1f2f6' : '#74b9ff'};
    color: ${props => props.$isFollowing ? '#b2bec3' : 'white'};
    &:hover { transform: translateY(-2px); }
`;

const StatRow = styled.div` display: flex; gap: 30px; margin-bottom: 20px; `;
const StatItem = styled.div` font-size: 16px; color: #636e72; b { color: #2d3436; font-weight: 900; } `;
const Bio = styled.p` font-size: 15px; color: #2d3436; line-height: 1.6; `;

const ContentSection = styled.div` border-top: 2px solid #f0f7ff; padding-top: 20px; `;
const SectionHeader = styled.div` 
    display: flex; justify-content: center; margin-bottom: 30px;
    span { font-weight: 900; font-size: 13px; color: #b2bec3; letter-spacing: 2px; }
`;

const PostGrid = styled.div`
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
`;

const PostThumb = styled.div`
    aspect-ratio: 1/1; background: #f8fbff; border-radius: 15px; overflow: hidden;
    position: relative; cursor: pointer; border: 1px solid #f1f2f6;
    &:hover .overlay { opacity: 1; }
`;

const ThumbImg = styled.img` width: 100%; height: 100%; object-fit: cover; `;

const TextThumb = styled.div`
    width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
    padding: 20px; text-align: center; font-size: 14px; color: #636e72;
    p { overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; }
`;

const ThumbOverlay = styled.div`
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(116, 185, 255, 0.4); backdrop-filter: blur(2px);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: 0.3s;
    span { color: white; font-weight: 900; font-size: 14px; border: 2px solid white; padding: 5px 15px; border-radius: 20px; }
`;

const PrivateOverlay = styled.div`
    text-align: center; padding: 100px 0; color: #b2bec3;
`;
const LockIcon = styled.div` font-size: 50px; margin-bottom: 20px; `;
const PrivateText = styled.p` font-size: 20px; font-weight: 900; color: #2d3436; margin-bottom: 10px; `;
const PrivateSub = styled.p` font-size: 15px; `;

const EmptyFeed = styled.div` grid-column: span 3; text-align: center; padding: 100px; color: #b2bec3; font-weight: bold; `;
const Loading = styled.div` text-align: center; padding: 150px; color: #74b9ff; font-weight: 900; `;

export default UserPage;