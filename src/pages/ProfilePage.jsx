import React, { useEffect, useState, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import Swal from 'sweetalert2';

const ProfilePage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);

    const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
    const myId = localStorage.getItem('userId');

    const getFullImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const baseUrl = SERVER_URL.endsWith('/') ? SERVER_URL.slice(0, -1) : SERVER_URL;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${baseUrl}${cleanPath}`;
    };

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            // [Fact] 백엔드 라우터 구조에 따라 /auth/profile/:id 호출
            const endpoint = userId ? `/auth/profile/${userId}` : `/auth/me`;
            const res = await api.get(endpoint);

            // [Fact] 응답 데이터에서 user 객체 또는 전체 데이터 추출
            const data = res.data?.user || res.data;

            if (!data) throw new Error("데이터를 찾을 수 없습니다.");

            setProfile(data);
            setIsFollowing(data.isFollowing || false);
        } catch (err) {
            console.error("Profile Fetch Error:", err);
            Swal.fire('오류', '프로필 정보를 불러올 수 없습니다.', 'error');
            navigate(-1);
        } finally {
            setLoading(false);
        }
    }, [userId, navigate]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleFollow = async () => {
        if (!myId) return Swal.fire('알림', '로그인이 필요합니다.', 'info');
        try {
            // [Fact] 백엔드 라우터 경로에 맞춰 /auth/follow/:id 호출
            const res = await api.post(`/auth/follow/${userId}`);
            const updatedFollowing = res.data.isFollowing;

            setIsFollowing(updatedFollowing);
            setProfile(prev => ({
                ...prev,
                counts: {
                    ...prev.counts,
                    followers: updatedFollowing
                        ? (Number(prev.counts?.followers || 0) + 1)
                        : (Number(prev.counts?.followers || 0) - 1)
                }
            }));
        } catch (err) {
            Swal.fire('오류', '팔로우 처리 중 문제가 발생했습니다.', 'error');
        }
    };

    const handleMessage = () => {
        // [Fact] 이동 타겟 ID 결정
        const targetId = userId || profile?.id || profile?._id;
        if (!targetId) {
            return Swal.fire('알림', '상대방 ID를 찾을 수 없습니다.', 'warning');
        }
        // [Fact] App.js에 등록된 채팅 경로로 이동
        navigate(`/chat/${targetId}`);
    };

    if (loading) return <Loading>🫧 프로필 로딩 중...</Loading>;
    if (!profile) return <Loading>정보를 찾을 수 없습니다.</Loading>;

    const isOtherUser = userId && String(userId) !== String(myId);

    return (
        <FullBackground>
            <Container>
                <Header>
                    <BackBtn onClick={() => navigate(-1)}>〈</BackBtn>
                    <TitleCol>
                        <Title>유저 프로필</Title>
                        <SubTitle>@{profile.nickname}님의 공간입니다.</SubTitle>
                    </TitleCol>
                </Header>

                <ProfileCard>
                    <ProfileMain>
                        <Avatar
                            src={profile.profilePic || profile.profileImage
                                ? getFullImageUrl(profile.profilePic || profile.profileImage)
                                : `https://ui-avatars.com/api/?name=${profile.nickname}&background=74b9ff&color=fff`}
                        />
                        <InfoCol>
                            <UserRow>
                                <UserName>@{profile.nickname}</UserName>
                                {isOtherUser && (
                                    <ButtonGroup>
                                        <FollowBtn $isFollowing={isFollowing} onClick={handleFollow}>
                                            {isFollowing ? '팔로잉' : '팔로우'}
                                        </FollowBtn>
                                        <DMBtn onClick={handleMessage}>
                                           💌 메시지
                                        </DMBtn>
                                    </ButtonGroup>
                                )}
                            </UserRow>
                            <Bio>{profile.bio || "아직 소개글이 없습니다. 🫧"}</Bio>
                            <StatRow>
                                <StatItem>게시물 <b>{profile.counts?.posts || profile.posts?.length || 0}</b></StatItem>
                                <StatItem>팔로워 <b>{profile.counts?.followers || 0}</b></StatItem>
                                <StatItem>팔로잉 <b>{profile.counts?.following || 0}</b></StatItem>
                            </StatRow>
                        </InfoCol>
                    </ProfileMain>
                </ProfileCard>

                <SectionDivider>버블 피드</SectionDivider>
                <PostGrid>
                    {profile.posts && profile.posts.length > 0 ? (
                        profile.posts.map(post => (
                            <PostItem key={post.id || post._id} onClick={() => navigate(`/post/${post.id || post._id}`)}>
                                {post.imageUrl ? (
                                    <img src={getFullImageUrl(post.imageUrl)} alt="post" />
                                ) : (
                                    <PostTextPreview>{post.content}</PostTextPreview>
                                )}
                            </PostItem>
                        ))
                    ) : (
                        <EmptyMsg>아직 게시물이 없습니다. 🫧</EmptyMsg>
                    )}
                </PostGrid>
            </Container>
        </FullBackground>
    );
};

/* --- 스타일 정의 --- */
const fadeIn = keyframes` from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } `;
const FullBackground = styled.div` width: 100%; min-height: 100vh; background-color: #f8fbff; `;
const Container = styled.div` max-width: 900px; margin: 0 auto; padding: 40px 20px 100px; animation: ${fadeIn} 0.5s ease-out; `;
const Header = styled.div` display: flex; align-items: center; gap: 20px; margin-bottom: 40px; `;
const BackBtn = styled.button` background: white; border: none; width: 50px; height: 50px; border-radius: 18px; font-size: 20px; cursor: pointer; color: #74b9ff; display: flex; align-items: center; justify-content: center; box-shadow: 0 5px 15px rgba(0,0,0,0.03); transition: 0.3s; &:hover { background: #74b9ff; color: white; transform: translateX(-5px); } `;
const TitleCol = styled.div` display: flex; flex-direction: column; gap: 4px; `;
const Title = styled.h2` margin: 0; font-size: 28px; font-weight: 900; color: #2d3436; `;
const SubTitle = styled.span` font-size: 15px; color: #b2bec3; `;
const ProfileCard = styled.div` background: white; padding: 50px; border-radius: 40px; box-shadow: 0 20px 50px rgba(116, 185, 255, 0.08); border: 1px solid rgba(116, 185, 255, 0.1); margin-bottom: 50px; `;
const ProfileMain = styled.div` display: flex; align-items: center; gap: 60px; `;
const Avatar = styled.img` width: 180px; height: 180px; border-radius: 60px; object-fit: cover; border: 4px solid #f0f7ff; box-shadow: 0 10px 30px rgba(116, 185, 255, 0.15); `;
const InfoCol = styled.div` flex: 1; `;
const UserRow = styled.div` display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 20px; `;
const UserName = styled.h1` margin: 0; font-size: 34px; font-weight: 900; color: #2d3436; `;
const ButtonGroup = styled.div` display: flex; gap: 10px; `;
const FollowBtn = styled.button` padding: 12px 25px; border-radius: 15px; font-size: 15px; font-weight: 800; cursor: pointer; transition: 0.3s; border: none; background: ${props => props.$isFollowing ? '#f1f2f6' : 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)'}; color: ${props => props.$isFollowing ? '#b2bec3' : 'white'}; &:hover { transform: translateY(-3px); } `;
const DMBtn = styled.button` padding: 12px 25px; border-radius: 15px; font-size: 14px; font-weight: 800; cursor: pointer; transition: 0.3s; background: white; color: #74b9ff; border: 2px solid #74b9ff; &:hover { background: #f0f7ff; transform: translateY(-3px); } `;
const Bio = styled.p` font-size: 17px; color: #636e72; line-height: 1.7; margin-bottom: 30px; `;
const StatRow = styled.div` display: flex; gap: 45px; `;
const StatItem = styled.div` font-size: 16px; color: #b2bec3; b { color: #74b9ff; font-weight: 900; font-size: 22px; margin-right: 6px; } `;
const SectionDivider = styled.div` margin-bottom: 30px; text-align: center; font-weight: 900; color: #74b9ff; font-size: 14px; letter-spacing: 4px; text-transform: uppercase; display: flex; align-items: center; gap: 20px; &::before, &::after { content: ""; flex: 1; height: 2px; background: #e1f0ff; } `;
const PostGrid = styled.div` display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; `;
const PostItem = styled.div` aspect-ratio: 1 / 1; border-radius: 20px; overflow: hidden; cursor: pointer; background: white; border: 1px solid #f0f7ff; transition: 0.3s; img { width: 100%; height: 100%; object-fit: cover; } &:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(116, 185, 255, 0.15); } `;
const PostTextPreview = styled.div` padding: 20px; font-size: 14px; color: #636e72; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; `;
const EmptyMsg = styled.div` grid-column: 1 / -1; text-align: center; padding: 80px 0; color: #b2bec3; font-weight: 800; `;
const Loading = styled.div` text-align: center; padding: 150px; font-weight: 900; color: #74b9ff; font-size: 22px; `;

export default ProfilePage;