import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import api from '../api/api';
import Swal from 'sweetalert2';

const MyPage = () => {
    const [user, setUser] = useState(null);
    const [myPosts, setMyPosts] = useState([]);
    const [myReports, setMyReports] = useState([]);
    const [myFollowing, setMyFollowing] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [viewMode, setViewMode] = useState('posts');
    const [loading, setLoading] = useState(true);

    const [editData, setEditData] = useState({
        nickname: '',
        bio: '',
        password: '',
        confirmPassword: ''
    });

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

    const getFullImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('data:')) return path;
        const baseUrl = path.startsWith('http') ? path : `${SERVER_URL}${path.startsWith('/') ? path : `/${path}`}`;
        return `${baseUrl}?v=${new Date().getTime()}`;
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [userRes, postsRes] = await Promise.all([
                api.get('/auth/me'),
                api.get('/posts')
            ]);

            // [Fact] 신고 내역 조회 시 백엔드에서 include: { post: true }가 되어 있어야 게시물 정보가 보입니다.
            try {
                const reportRes = await api.get('/reports/my');
                setMyReports(Array.isArray(reportRes.data) ? reportRes.data : []);
            } catch (e) {
                // 경로 호환성 대응
                const altReportRes = await api.get('/posts/reports/my').catch(() => ({ data: [] }));
                setMyReports(Array.isArray(altReportRes.data) ? altReportRes.data : []);
            }

            const userData = userRes.data.user || userRes.data;
            if (userData && userData.id) {
                setUser(userData);
                setEditData({
                    nickname: userData.nickname || '',
                    bio: userData.bio || '',
                    password: '',
                    confirmPassword: ''
                });
                setPreviewUrl(userData.profilePic ? getFullImageUrl(userData.profilePic) : null);

                const allPosts = Array.isArray(postsRes.data) ? postsRes.data : [];
                setMyPosts(allPosts.filter(p => String(p.authorId || p.userId) === String(userData.id)));
                setMyFollowing(userData.following || []);
            }
        } catch (err) {
            console.error("데이터 로딩 실패:", err);
        } finally {
            setTimeout(() => setLoading(false), 800);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result);
        reader.readAsDataURL(file);
    };

    const handleSaveProfile = async () => {
        try {
            if (editData.password) {
                if (editData.password !== editData.confirmPassword) {
                    return Swal.fire('알림', '비밀번호가 일치하지 않습니다.', 'warning');
                }
                await api.put('/auth/change-password', { password: editData.password });
            }
            const formData = new FormData();
            formData.append('nickname', editData.nickname || '');
            formData.append('bio', editData.bio || '');
            if (selectedFile) formData.append('profilePic', selectedFile);

            await api.put('/auth/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            await Swal.fire('성공', '프로필이 수정되었습니다. 🫧', 'success');
            setIsEditing(false);
            fetchData();
        } catch (err) {
            Swal.fire('에러', '프로필 수정 중 오류 발생', 'error');
        }
    };

    if (loading) return (
        <LoadingContainer>
            <BubbleLoader />
            <LoadingText>🫧 데이터를 불러오는 중...</LoadingText>
        </LoadingContainer>
    );

    if (!user) return null;

    return (
        <FullBackground>
            <Container>
                <ProfileCard>
                    <AvatarWrapper onClick={() => isEditing && fileInputRef.current.click()}>
                        <Avatar src={previewUrl || `https://ui-avatars.com/api/?name=${user.nickname}&background=74c0fc&color=fff`} />
                        {isEditing && <Overlay>변경</Overlay>}
                        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
                    </AvatarWrapper>

                    <InfoWrapper>
                        <div className="header-row">
                            {isEditing ? (
                                <EditInput value={editData.nickname} onChange={e => setEditData({...editData, nickname: e.target.value})} />
                            ) : (
                                <NicknameRow>
                                    <Nickname>@{user.nickname}</Nickname>
                                    <BubbleBadge $isAdult={user.isAdult}>{user.isAdult ? '🐋' : '🐠'}</BubbleBadge>
                                </NicknameRow>
                            )}
                            <BtnGroup>
                                <EditBtn onClick={isEditing ? handleSaveProfile : () => setIsEditing(true)} $isEditing={isEditing}>
                                    {isEditing ? '변경 저장' : '프로필 편집'}
                                </EditBtn>
                                {isEditing && <CancelBtn onClick={() => { setIsEditing(false); fetchData(); }}>취소</CancelBtn>}
                            </BtnGroup>
                        </div>

                        <StatsRow>
                            <StatItem onClick={() => setViewMode('posts')}>게시물 <b>{myPosts.length}</b></StatItem>
                            <StatItem onClick={() => setViewMode('reports')}>신고 <b>{myReports.length}</b></StatItem>
                            <StatItem onClick={() => setViewMode('following')}>팔로잉 <b>{myFollowing.length}</b></StatItem>
                            <StatItem>팔로워 <b>{user.followers?.length || 0}</b></StatItem>
                        </StatsRow>

                        {!isEditing && <BioText>{user.bio || "아직 자기소개가 없습니다. 🫧"}</BioText>}
                        {isEditing && (
                            <EditArea>
                                <Label>한줄 소개</Label>
                                <EditTextArea value={editData.bio} onChange={e => setEditData({...editData, bio: e.target.value})} />
                            </EditArea>
                        )}
                    </InfoWrapper>
                </ProfileCard>

                <TabArea>
                    <TabItem $active={viewMode === 'posts'} onClick={() => setViewMode('posts')}>POSTS</TabItem>
                    <TabItem $active={viewMode === 'following'} onClick={() => setViewMode('following')}>FOLLOWING</TabItem>
                    <TabItem $active={viewMode === 'reports'} onClick={() => setViewMode('reports')}>REPORTS</TabItem>
                </TabArea>

                {viewMode === 'posts' && (
                    <PostGrid>
                        {myPosts.map(p => (
                            <PostCard key={p.id} onClick={() => navigate(`/post/${p.id}`)}>
                                {p.imageUrl ? <img src={getFullImageUrl(p.imageUrl)} alt="" /> : <NoImgBox>{p.content?.substring(0, 30)}...</NoImgBox>}
                            </PostCard>
                        ))}
                    </PostGrid>
                )}

                {viewMode === 'following' && (
                    <FollowingList>
                        {myFollowing.length > 0 ? (
                            myFollowing.map(f => (
                                <UserItem key={f.followingId} onClick={() => navigate(`/dm/${f.followingId}`)}>
                                    <UserAvatar src={f.following?.profilePic ? getFullImageUrl(f.following.profilePic) : `https://ui-avatars.com/api/?name=${f.following?.nickname}&background=e7f5ff&color=74c0fc`} />
                                    <UserInfo>
                                        <UserNick>@{f.following?.nickname || '알 수 없는 유저'}</UserNick>
                                        <UserBio>{f.following?.bio || '🫧'}</UserBio>
                                    </UserInfo>
                                    <GoBtn>대화하기</GoBtn>
                                </UserItem>
                            ))
                        ) : (
                            <EmptyMsg>팔로잉 중인 유저가 없습니다. 🫧</EmptyMsg>
                        )}
                    </FollowingList>
                )}

                {viewMode === 'reports' && (
                    <ReportContainer>
                        {myReports.length > 0 ? (
                            myReports.map((report) => (
                                <ReportCard key={report.id} onClick={() => report.postId && navigate(`/post/${report.postId}`)}>
                                    <ReportInfo>
                                        <ReasonBadge>신고 사유</ReasonBadge>
                                        <ReasonText>{report.reason}</ReasonText>
                                        <ReportTime>{new Date(report.createdAt).toLocaleString()}</ReportTime>
                                    </ReportInfo>
                                    {report.post && (
                                        <TargetPostPreview>
                                            {report.post.imageUrl ? (
                                                <img src={getFullImageUrl(report.post.imageUrl)} alt="신고 게시물" />
                                            ) : (
                                                <div className="text-preview">{report.post.content?.substring(0, 50)}...</div>
                                            )}
                                        </TargetPostPreview>
                                    )}
                                </ReportCard>
                            ))
                        ) : (
                            <EmptyMsg>신고 내역이 없습니다. 🚨</EmptyMsg>
                        )}
                    </ReportContainer>
                )}
            </Container>
        </FullBackground>
    );
};

/* --- 스타일 컴포넌트 --- */

const rotate = keyframes` from { transform: rotate(0deg); } to { transform: rotate(360deg); } `;
const float = keyframes` 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } `;
const LoadingContainer = styled.div` display: flex; flex-direction: column; align-items: center; justify-content: center; height: 80vh; background-color: #f0f9ff; `;
const BubbleLoader = styled.div` width: 60px; height: 60px; border: 5px solid rgba(116, 192, 252, 0.2); border-top: 5px solid #74c0fc; border-radius: 50%; animation: ${rotate} 1s linear infinite; position: relative; box-shadow: 0 0 15px rgba(116, 192, 252, 0.4); `;
const LoadingText = styled.div` margin-top: 20px; color: #74c0fc; font-weight: 800; font-size: 18px; animation: ${float} 2s ease-in-out infinite; `;
const FullBackground = styled.div` width: 100%; min-height: 100vh; background-color: #f0f9ff; `;
const Container = styled.div` max-width: 1000px; margin: 0 auto; padding: 60px 20px 100px; `;
const ProfileCard = styled.div` background: white; padding: 50px; border-radius: 40px; display: flex; gap: 60px; box-shadow: 0 15px 40px rgba(165, 216, 255, 0.1); border: 2px solid #e7f5ff; margin-bottom: 50px; align-items: flex-start; @media (max-width: 768px) { flex-direction: column; align-items: center; text-align: center; gap: 30px; } `;
const AvatarWrapper = styled.div` width: 160px; height: 160px; border-radius: 50%; overflow: hidden; position: relative; cursor: pointer; border: 5px solid #f0f9ff; flex-shrink: 0; `;
const Avatar = styled.img` width: 100%; height: 100%; object-fit: cover; `;
const Overlay = styled.div` position: absolute; inset: 0; background: rgba(116, 192, 252, 0.4); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; `;
const InfoWrapper = styled.div` flex: 1; .header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; @media (max-width: 768px) { flex-direction: column; gap: 20px; } } `;
const NicknameRow = styled.div` display: flex; align-items: center; gap: 12px; `;
const Nickname = styled.h2` font-size: 32px; font-weight: 900; color: #495057; margin: 0; `;
const BubbleBadge = styled.div` display: flex; justify-content: center; align-items: center; width: 32px; height: 32px; font-size: 16px; background: white; border: 2px solid ${props => props.$isAdult ? '#74c0fc' : '#63e6be'}; border-radius: 50%; `;
const EditArea = styled.div` display: flex; flex-direction: column; gap: 15px; `;
const Label = styled.label` font-size: 14px; font-weight: 800; color: #74c0fc; text-align: left; `;
const EditInput = styled.input` padding: 12px 15px; border-radius: 12px; border: 2px solid #e7f5ff; font-size: 16px; `;
const EditTextArea = styled.textarea` padding: 12px 15px; border-radius: 12px; border: 2px solid #e7f5ff; font-size: 16px; resize: none; min-height: 80px; `;
const BtnGroup = styled.div` display: flex; gap: 10px; `;
const EditBtn = styled.button` padding: 12px 24px; border-radius: 15px; border: 2px solid #74c0fc; background: ${p => p.$isEditing ? '#74c0fc' : 'white'}; color: ${p => p.$isEditing ? 'white' : '#74c0fc'}; font-weight: 800; cursor: pointer; `;
const CancelBtn = styled.button` padding: 12px 24px; border-radius: 15px; background: #ff8787; color: white; border: none; font-weight: 800; cursor: pointer; `;
const StatsRow = styled.div` display: flex; gap: 40px; margin-bottom: 25px; `;
const StatItem = styled.div` font-size: 18px; color: #495057; cursor: pointer; b { color: #74c0fc; } `;
const BioText = styled.p` font-size: 17px; color: #868e96; line-height: 1.6; `;
const TabArea = styled.div` border-top: 2px solid #e7f5ff; display: flex; justify-content: center; margin-bottom: 30px; `;
const TabItem = styled.div` cursor: pointer; padding: 20px 40px; border-top: 3px solid ${p => p.$active ? '#74c0fc' : 'transparent'}; font-weight: 900; color: ${p => p.$active ? '#74c0fc' : '#a5d8ff'}; `;
const PostGrid = styled.div` display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; `;
const PostCard = styled.div` aspect-ratio: 1/1; background: white; border-radius: 20px; overflow: hidden; border: 1.5px solid #e7f5ff; cursor: pointer; img { width: 100%; height: 100%; object-fit: cover; } `;
const NoImgBox = styled.div` height: 100%; display: flex; align-items: center; justify-content: center; background: #f8fbff; color: #a5d8ff; padding: 20px; text-align: center; `;
const EmptyMsg = styled.div` text-align: center; padding: 50px; color: #a5d8ff; font-weight: 800; `;

/* --- 신고 탭 강화 스타일 --- */
const ReportContainer = styled.div` display: flex; flex-direction: column; gap: 15px; `;
const ReportCard = styled.div` background: white; padding: 20px 30px; border-radius: 25px; border: 1.5px solid #e7f5ff; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: 0.2s; &:hover { border-color: #ff8787; transform: translateY(-3px); } `;
const ReportInfo = styled.div` flex: 1; `;
const ReasonBadge = styled.div` display: inline-block; padding: 4px 10px; background: #fff5f5; color: #ff8787; border-radius: 8px; font-size: 12px; font-weight: 800; margin-bottom: 8px; `;
const ReasonText = styled.div` font-weight: 800; font-size: 18px; color: #495057; margin-bottom: 5px; `;
const ReportTime = styled.div` font-size: 13px; color: #adb5bd; `;
const TargetPostPreview = styled.div` width: 80px; height: 80px; border-radius: 15px; overflow: hidden; background: #f8fbff; flex-shrink: 0; img { width: 100%; height: 100%; object-fit: cover; } .text-preview { font-size: 10px; color: #adb5bd; padding: 5px; overflow: hidden; } `;

const FollowingList = styled.div` display: flex; flex-direction: column; gap: 15px; `;
const UserItem = styled.div` background: white; padding: 20px 30px; border-radius: 25px; display: flex; align-items: center; gap: 20px; border: 1.5px solid #e7f5ff; cursor: pointer; `;
const UserAvatar = styled.img` width: 60px; height: 60px; border-radius: 50%; object-fit: cover; `;
const UserInfo = styled.div` flex: 1; `;
const UserNick = styled.div` font-weight: 900; font-size: 18px; `;
const UserBio = styled.div` font-size: 14px; color: #adb5bd; `;
const GoBtn = styled.div` padding: 8px 16px; background: #e7f5ff; color: #74c0fc; border-radius: 12px; font-weight: 800; `;

export default MyPage;