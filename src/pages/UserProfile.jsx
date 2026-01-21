import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../api/api';
import Swal from 'sweetalert2';

const UserProfile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    // 환경 변수 또는 고정 URL 사용
    const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/users/${userId}`);
                // [Fact] res.data.user 구조에 맞춰 데이터 설정
                setUserData(res.data.user);

                // 비공개 계정이 아니고(1이 아님), 차단되지 않았을 때 게시글 로드
                if (res.data.user.isPrivate !== 1) {
                    const postRes = await api.get(`/posts/user/${userId}`);
                    setPosts(Array.isArray(postRes.data) ? postRes.data : []);
                }
            } catch (err) {
                console.error("사용자 정보 로드 실패");
                Swal.fire('오류', '사용자를 찾을 수 없습니다.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [userId]);

    if (loading) return <Loading>버블 속 유저를 찾는 중... 🫧</Loading>;
    if (!userData) return <Loading>사용자 정보가 없습니다.</Loading>;

    return (
        <Container>
            <Header>
                <BackBtn onClick={() => navigate(-1)}>〈</BackBtn>
                <TitleCol>
                    <Title>@{userData.nickname}님의 프로필</Title>
                    <SubTitle>버블 네트워크 유저 상세 정보</SubTitle>
                </TitleCol>
            </Header>

            <ProfileCard>
                <ProfileMain>
                    <Avatar
                        src={userData.profilePic
                            ? `${SERVER_URL}${userData.profilePic}`
                            : `https://ui-avatars.com/api/?name=${userData.nickname}&background=74b9ff&color=fff`}
                    />
                    <InfoCol>
                        <NameRow>
                            <Nickname>@{userData.nickname}</Nickname>
                            <AgeBadge $isAdult={userData.age >= 19}>
                                {userData.age >= 19 ? '성인 🐳' : '미성년자 🐠'}
                            </AgeBadge>
                            {/* 필요 시 여기에 팔로우 버튼 추가 가능 */}
                        </NameRow>

                        <StatRow>
                            <StatItem>게시물 <b>{posts.length}</b></StatItem>
                            <StatItem>팔로워 <b>{userData._count?.followers || 0}</b></StatItem>
                            <StatItem>팔로잉 <b>{userData._count?.following || 0}</b></StatItem>
                        </StatRow>

                        <Bio>{userData.bio || "아직 소개가 없는 조용한 버블 유저입니다. 🫧"}</Bio>
                    </InfoCol>
                </ProfileMain>
            </ProfileCard>

            <ContentArea>
                <SectionLabel>POSTS</SectionLabel>
                {userData.isPrivate === 1 ? (
                    <PrivateMsg>
                        <LockIcon>🔒</LockIcon>
                        <p>비공개 계정입니다.</p>
                        <span>팔로우를 맺어야 이 유저의 게시글을 볼 수 있습니다.</span>
                    </PrivateMsg>
                ) : (
                    <PostGrid>
                        {posts.length > 0 ? (
                            posts.map(p => (
                                <PostThumbWrapper key={p.id} onClick={() => navigate(`/post/${p.id}`)}>
                                    <PostThumb src={`${SERVER_URL}${p.imageUrl}`} alt="post" />
                                    <Overlay className="overlay">
                                        <span>자세히 보기</span>
                                    </Overlay>
                                </PostThumbWrapper>
                            ))
                        ) : (
                            <EmptyMsg>게시물이 아직 없습니다.</EmptyMsg>
                        )}
                    </PostGrid>
                )}
            </ContentArea>
        </Container>
    );
};

export default UserProfile;

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
    display: flex; align-items: center; justify-content: center;
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

const ProfileMain = styled.div` display: flex; align-items: center; gap: 60px; `;

const Avatar = styled.img`
    width: 150px; height: 150px; border-radius: 50%; object-fit: cover;
    border: 5px solid #f0f7ff; box-shadow: 0 5px 15px rgba(0,0,0,0.05);
`;

const InfoCol = styled.div` flex: 1; `;

const NameRow = styled.div` display: flex; align-items: center; gap: 15px; margin-bottom: 15px; `;
const Nickname = styled.h3` margin: 0; font-size: 28px; font-weight: 900; color: #2d3436; `;

const AgeBadge = styled.span`
    background: ${props => props.$isAdult ? '#fff1f2' : '#f0f7ff'};
    color: ${props => props.$isAdult ? '#ff4757' : '#74b9ff'};
    padding: 4px 12px; border-radius: 8px; font-size: 12px; font-weight: 800;
`;

const StatRow = styled.div` display: flex; gap: 30px; margin-bottom: 20px; `;
const StatItem = styled.div` font-size: 16px; color: #636e72; b { color: #2d3436; font-weight: 900; } `;
const Bio = styled.p` font-size: 15px; color: #2d3436; line-height: 1.6; margin: 0; `;

const ContentArea = styled.div` border-top: 2px solid #f0f7ff; padding-top: 30px; `;

const SectionLabel = styled.div`
    text-align: center; font-weight: 900; font-size: 13px; color: #b2bec3; 
    letter-spacing: 2px; margin-bottom: 30px;
`;

const PostGrid = styled.div`
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
`;

const PostThumbWrapper = styled.div`
    position: relative; aspect-ratio: 1/1; border-radius: 15px; overflow: hidden;
    cursor: pointer; border: 1px solid #f1f2f6;
    &:hover .overlay { opacity: 1; }
`;

const PostThumb = styled.img` width: 100%; height: 100%; object-fit: cover; `;

const Overlay = styled.div`
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(116, 185, 255, 0.3); backdrop-filter: blur(3px);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: 0.3s;
    span { color: white; font-weight: 900; border: 2px solid white; padding: 5px 15px; border-radius: 20px; }
`;

const PrivateMsg = styled.div` text-align: center; padding: 100px 0; color: #b2bec3; `;
const LockIcon = styled.div` font-size: 50px; margin-bottom: 20px; `;
const EmptyMsg = styled.div` grid-column: span 3; text-align: center; padding: 100px; color: #b2bec3; font-weight: bold; `;
const Loading = styled.div` text-align: center; margin-top: 150px; font-weight: 900; color: #74b9ff; `;