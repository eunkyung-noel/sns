import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../api/api';
import Swal from 'sweetalert2';

const MyPage = () => {
    const [user, setUser] = useState(null);
    const [myPosts, setMyPosts] = useState([]);
    const [myReports, setMyReports] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [viewMode, setViewMode] = useState('posts');
    const [loading, setLoading] = useState(true);

    const [editData, setEditData] = useState({
        nickname: '',
        bio: '',
        password: '',
        confirmPassword: ''
    });

    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

    const fetchData = async () => {
        try {
            setLoading(true);
            const [userRes, postsRes, reportRes] = await Promise.all([
                api.get('/auth/me'),
                api.get('/posts'),
                api.get('/posts/reports/my').catch(() => ({ data: [] }))
            ]);

            const userData = userRes.data.user || userRes.data;
            if (userData && userData.id) {
                setUser(userData);
                setEditData({
                    nickname: userData.nickname || '',
                    bio: userData.bio || '',
                    password: '',
                    confirmPassword: ''
                });

                const allPosts = Array.isArray(postsRes.data) ? postsRes.data : [];
                setMyPosts(allPosts.filter(p => String(p.authorId || p.userId) === String(userData.id)));
                setMyReports(Array.isArray(reportRes.data) ? reportRes.data : []);
            }
        } catch (err) {
            console.error("데이터 로딩 실패:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSaveProfile = async () => {
        try {
            // 비밀번호 변경 로직
            if (editData.password) {
                if (editData.password !== editData.confirmPassword) {
                    return Swal.fire('알림', '비밀번호가 일치하지 않습니다.', 'warning');
                }
                await api.put('/auth/change-password', { password: editData.password });
            }

            // [Fact] 언어 설정을 제외한 업데이트 데이터 구성
            const updatePayload = {
                nickname: editData.nickname,
                bio: editData.bio
            };

            await api.put('/auth/profile', updatePayload);
            await Swal.fire('성공', '프로필이 수정되었습니다. 🫧', 'success');
            setIsEditing(false);
            fetchData();
        } catch (err) {
            const errorMsg = err.response?.data?.message || '수정 중 오류가 발생했습니다.';
            Swal.fire('에러', errorMsg, 'error');
        }
    };

    const getFullImageUrl = (path) => {
        if (!path) return null;
        return path.startsWith('http') ? path : `${SERVER_URL}${path.startsWith('/') ? path : `/${path}`}`;
    };

    if (loading) return <Loading>🫧 로딩 중...</Loading>;
    if (!user) return null;

    return (
        <FullBackground>
            <Container>
                <ProfileCard>
                    <AvatarWrapper onClick={() => isEditing && fileInputRef.current.click()}>
                        <Avatar src={user.profilePic ? getFullImageUrl(user.profilePic) : `https://ui-avatars.com/api/?name=${user.nickname}&background=74b9ff&color=fff`} />
                        {isEditing && <Overlay>변경</Overlay>}
                        <input type="file" ref={fileInputRef} hidden accept="image/*" />
                    </AvatarWrapper>

                    <InfoWrapper>
                        <div className="header-row">
                            {isEditing ? (
                                <EditInput
                                    value={editData.nickname}
                                    onChange={e => setEditData({...editData, nickname: e.target.value})}
                                    placeholder="닉네임"
                                />
                            ) : (
                                <Nickname>@{user.nickname}</Nickname>
                            )}
                            <BtnGroup>
                                <EditBtn onClick={isEditing ? handleSaveProfile : () => setIsEditing(true)} $isEditing={isEditing}>
                                    {isEditing ? '변경 저장' : '프로필 편집'}
                                </EditBtn>
                                {isEditing && (
                                    <CancelBtn onClick={() => { setIsEditing(false); fetchData(); }}>취소</CancelBtn>
                                )}
                                {!isEditing && (
                                    <ModeBtn onClick={() => setViewMode(viewMode === 'posts' ? 'reports' : 'posts')}>
                                        {viewMode === 'posts' ? '🚨 신고 내역' : '🖼️ 게시물'}
                                    </ModeBtn>
                                )}
                            </BtnGroup>
                        </div>

                        <StatsRow>
                            <StatItem>게시물 <b>{myPosts.length}</b></StatItem>
                            <StatItem>신고 <b>{myReports.length}</b></StatItem>
                            <StatItem>팔로워 <b>{user.followers?.length || 0}</b></StatItem>
                        </StatsRow>

                        {isEditing ? (
                            <EditArea>
                                <Label>한줄 소개</Label>
                                <EditTextArea
                                    value={editData.bio}
                                    onChange={e => setEditData({...editData, bio: e.target.value})}
                                    placeholder="자신을 소개해보세요. 🫧"
                                />
                                <InputGrid>
                                    <Field>
                                        <Label>비밀번호 변경</Label>
                                        <EditInput
                                            type="password"
                                            placeholder="새 비밀번호"
                                            value={editData.password}
                                            onChange={e => setEditData({...editData, password: e.target.value})}
                                        />
                                    </Field>
                                    <Field>
                                        <Label>비밀번호 확인</Label>
                                        <EditInput
                                            type="password"
                                            placeholder="비밀번호 확인"
                                            value={editData.confirmPassword}
                                            onChange={e => setEditData({...editData, confirmPassword: e.target.value})}
                                        />
                                    </Field>
                                </InputGrid>
                            </EditArea>
                        ) : (
                            <BioText>{user.bio || "아직 자기소개가 없습니다. 🫧"}</BioText>
                        )}
                    </InfoWrapper>
                </ProfileCard>

                <TabArea>
                    <TabItem $active={viewMode === 'posts'}>
                        {viewMode === 'posts' ? 'POSTS' : 'REPORTS'}
                    </TabItem>
                </TabArea>

                {viewMode === 'posts' ? (
                    <PostGrid>
                        {myPosts.map(p => (
                            <PostCard key={p.id} onClick={() => navigate(`/post/${p.id}`)}>
                                {p.imageUrl ? <img src={getFullImageUrl(p.imageUrl)} alt="" /> : <NoImgBox>{p.content?.substring(0, 30)}...</NoImgBox>}
                            </PostCard>
                        ))}
                    </PostGrid>
                ) : (
                    <ReportContainer>
                        {myReports.length > 0 ? (
                            myReports.map((report, idx) => (
                                <ReportCard key={report.id || idx}>
                                    <ReasonText>사유: {report.reason}</ReasonText>
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

/* --- 스타일 정의 --- */
const FullBackground = styled.div` width: 100%; min-height: 100vh; background-color: #f8fbff; `;
const Container = styled.div` max-width: 1000px; margin: 0 auto; padding: 60px 20px 100px; `;
const ProfileCard = styled.div` background: white; padding: 50px; border-radius: 40px; display: flex; gap: 60px; box-shadow: 0 15px 40px rgba(116, 185, 255, 0.06); margin-bottom: 50px; align-items: flex-start; @media (max-width: 768px) { flex-direction: column; align-items: center; text-align: center; gap: 30px; } `;
const AvatarWrapper = styled.div` width: 160px; height: 160px; border-radius: 50%; overflow: hidden; position: relative; cursor: pointer; border: 5px solid #f0f7ff; flex-shrink: 0; `;
const Avatar = styled.img` width: 100%; height: 100%; object-fit: cover; `;
const Overlay = styled.div` position: absolute; inset: 0; background: rgba(0,0,0,0.3); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; `;
const InfoWrapper = styled.div` flex: 1; .header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; @media (max-width: 768px) { flex-direction: column; gap: 20px; } } `;
const Nickname = styled.h2` font-size: 32px; font-weight: 900; color: #2d3436; margin: 0; `;
const EditArea = styled.div` display: flex; flex-direction: column; gap: 15px; margin-top: 10px; `;
const InputGrid = styled.div` display: flex; gap: 20px; margin-top: 10px; @media (max-width: 768px) { flex-direction: column; } `;
const Field = styled.div` flex: 1; display: flex; flex-direction: column; gap: 8px; `;
const Label = styled.label` font-size: 14px; font-weight: 800; color: #74b9ff; text-align: left; `;
const EditInput = styled.input` padding: 12px 15px; border-radius: 12px; border: 2px solid #f1f2f6; font-size: 16px; outline: none; &:focus { border-color: #74b9ff; } `;
const EditTextArea = styled.textarea` padding: 12px 15px; border-radius: 12px; border: 2px solid #f1f2f6; font-size: 16px; outline: none; resize: none; min-height: 80px; &:focus { border-color: #74b9ff; } `;
const BtnGroup = styled.div` display: flex; gap: 10px; `;
const EditBtn = styled.button` padding: 12px 24px; border-radius: 15px; border: 2px solid #74b9ff; background: ${p => p.$isEditing ? '#74b9ff' : 'white'}; color: ${p => p.$isEditing ? 'white' : '#74b9ff'}; font-weight: 800; cursor: pointer; transition: 0.2s; `;
const CancelBtn = styled.button` padding: 12px 24px; border-radius: 15px; background: #ff4757; color: white; border: none; font-weight: 800; cursor: pointer; `;
const ModeBtn = styled.button` padding: 12px 24px; border-radius: 15px; border: none; background: #f1f2f6; color: #636e72; font-weight: 800; cursor: pointer; `;
const StatsRow = styled.div` display: flex; gap: 40px; margin-bottom: 25px; @media (max-width: 768px) { justify-content: center; } `;
const StatItem = styled.div` font-size: 18px; color: #2d3436; b { font-weight: 900; color: #74b9ff; margin-left: 6px; } `;
const BioText = styled.p` font-size: 17px; color: #636e72; line-height: 1.6; margin: 0; `;
const TabArea = styled.div` border-top: 2px solid #e1f0ff; display: flex; justify-content: center; margin-bottom: 30px; `;
const TabItem = styled.div` padding: 20px 40px; border-top: 3px solid ${p => p.$active ? '#74b9ff' : 'transparent'}; margin-top: -2px; font-weight: 900; color: ${p => p.$active ? '#74b9ff' : '#b2bec3'}; font-size: 16px; letter-spacing: 3px; transition: 0.3s; `;
const PostGrid = styled.div` display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; @media (max-width: 768px) { grid-template-columns: repeat(2, 1fr); } `;
const PostCard = styled.div` aspect-ratio: 1/1; background: white; border-radius: 20px; overflow: hidden; border: 1.5px solid #e1f0ff; transition: 0.3s; cursor: pointer; img { width: 100%; height: 100%; object-fit: cover; } &:hover { border-color: #74b9ff; transform: translateY(-5px); } `;
const NoImgBox = styled.div` height: 100%; display: flex; align-items: center; justify-content: center; background: #fbfcfe; color: #b2bec3; padding: 25px; text-align: center; font-size: 16px; `;
const ReportContainer = styled.div` display: flex; flex-direction: column; gap: 20px; `;
const ReportCard = styled.div` background: white; padding: 30px; border-radius: 25px; border: 1.5px solid #e1f0ff; `;
const ReasonText = styled.div` font-weight: 800; font-size: 18px; color: #2d3436; `;
const EmptyMsg = styled.div` text-align: center; padding: 50px; color: #b2bec3; font-size: 18px; font-weight: 800; `;
const Loading = styled.div` display: flex; align-items: center; justify-content: center; height: 80vh; color: #74b9ff; font-weight: bold; font-size: 24px; `;

export default MyPage;