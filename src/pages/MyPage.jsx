import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import api from '../api/api';
import Swal from 'sweetalert2';

const MyPage = () => {
    const [user, setUser] = useState(null);
    const [myPosts, setMyPosts] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ name: '', bio: '', profilePic: '' });

    // 데이터 로드
    const fetchMyData = async () => {
        try {
            const userRes = await api.get('/api/users/profile');
            const postsRes = await api.get('/api/posts');

            setUser(userRes.data);
            setEditData({
                name: userRes.data.name || '',
                bio: userRes.data.bio || '',
                profilePic: userRes.data.profilePic || ''
            });

            if (Array.isArray(postsRes.data)) {
                const filtered = postsRes.data.filter(p =>
                    (p.author?._id || p.author) === (userRes.data._id || userRes.data.id)
                );
                setMyPosts(filtered);
            }
        } catch (err) {
            console.error("데이터 연동 실패:", err);
        }
    };

    useEffect(() => { fetchMyData(); }, []);

    // 프로필 수정 저장
    const handleSaveProfile = async () => {
        try {
            await api.put('/api/users/profile', editData); // 백엔드 PUT 엔드포인트 확인
            setUser({ ...user, ...editData });
            setIsEditing(false);
            Swal.fire('성공', '프로필이 업데이트되었습니다.', 'success');
        } catch (err) {
            Swal.fire('오류', '수정 중 문제가 발생했습니다.', 'error');
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    if (!user) return <Loading>프로필 로딩 중... 🫧</Loading>;

    return (
        <Container>
            <ProfileSection>
                <AvatarArea>
                    <Avatar src={user.profilePic || `https://ui-avatars.com/api/?name=${user.name}&background=74b9ff&color=fff`} />
                </AvatarArea>

                <InfoArea>
                    <HeaderRow>
                        <UserName>{user.name}</UserName>
                        <ButtonGroup>
                            <ActionBtn onClick={() => setIsEditing(!isEditing)}>
                                {isEditing ? '취소' : '프로필 편집'}
                            </ActionBtn>
                            <LogoutBtn onClick={handleLogout}>로그아웃</LogoutBtn>
                        </ButtonGroup>
                    </HeaderRow>

                    <StatRow>
                        <StatItem>게시물 <b>{myPosts.length}</b></StatItem>
                        <StatItem onClick={() => Swal.fire('팔로워', `${user.followers?.length || 0}명`, 'info')}>
                            팔로워 <b>{user.followers?.length || 0}</b>
                        </StatItem>
                        <StatItem onClick={() => Swal.fire('팔로잉', `${user.following?.length || 0}명`, 'info')}>
                            팔로잉 <b>{user.following?.length || 0}</b>
                        </StatItem>
                    </StatRow>

                    {isEditing ? (
                        <EditForm>
                            <Input
                                placeholder="이름 변경"
                                value={editData.name}
                                onChange={(e) => setEditData({...editData, name: e.target.value})}
                            />
                            <TextArea
                                placeholder="소개글 입력"
                                value={editData.bio}
                                onChange={(e) => setEditData({...editData, bio: e.target.value})}
                            />
                            <SaveBtn onClick={handleSaveProfile}>변경사항 저장</SaveBtn>
                        </EditForm>
                    ) : (
                        <BioText>{user.bio || "아직 자기소개가 없습니다."}</BioText>
                    )}
                </InfoArea>
            </ProfileSection>

            <TabDivider />

            <PostGrid>
                {myPosts.map(post => (
                    <PostThumb key={post._id}>
                        {post.image ? <img src={post.image} alt="" /> : <p>{post.content}</p>}
                    </PostThumb>
                ))}
            </PostGrid>
        </Container>
    );
};

export default MyPage;

/* --- 스타일 정의 (건조하고 직설적인 UI) --- */
const Container = styled.div` max-width: 800px; margin: 0 auto; padding: 40px 20px; `;
const Loading = styled.div` text-align: center; margin-top: 100px; color: #74b9ff; `;

const ProfileSection = styled.div` display: flex; gap: 40px; margin-bottom: 40px; align-items: flex-start; `;
const AvatarArea = styled.div` flex-shrink: 0; `;
const Avatar = styled.img` width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 1px solid #eee; `;

const InfoArea = styled.div` flex-grow: 1; `;
const HeaderRow = styled.div` display: flex; align-items: center; gap: 20px; margin-bottom: 20px; `;
const UserName = styled.h2` font-size: 24px; font-weight: 400; margin: 0; `;

const StatRow = styled.div` display: flex; gap: 30px; margin-bottom: 20px; `;
const StatItem = styled.div` font-size: 16px; cursor: pointer; b { font-weight: 600; } `;

const BioText = styled.p` font-size: 15px; color: #262626; line-height: 1.4; white-space: pre-wrap; `;

const ButtonGroup = styled.div` display: flex; gap: 10px; `;
const ActionBtn = styled.button` padding: 5px 15px; border-radius: 4px; border: 1px solid #dbdbdb; background: #fff; font-weight: 600; cursor: pointer; `;
const LogoutBtn = styled.button` padding: 5px 15px; border-radius: 4px; border: none; background: #ff7675; color: #fff; font-weight: 600; cursor: pointer; `;

const EditForm = styled.div` display: flex; flex-direction: column; gap: 10px; margin-top: 10px; `;
const Input = styled.input` padding: 8px; border: 1px solid #dbdbdb; border-radius: 4px; `;
const TextArea = styled.textarea` padding: 8px; border: 1px solid #dbdbdb; border-radius: 4px; height: 60px; resize: none; `;
const SaveBtn = styled.button` background: #74b9ff; color: white; border: none; padding: 8px; border-radius: 4px; font-weight: bold; cursor: pointer; `;

const TabDivider = styled.div` border-top: 1px solid #dbdbdb; margin-bottom: 20px; `;
const PostGrid = styled.div` display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; `;
const PostThumb = styled.div` aspect-ratio: 1/1; background: #fafafa; border: 1px solid #eee; overflow: hidden; display: flex; align-items: center; justify-content: center; img { width: 100%; height: 100%; object-fit: cover; } p { font-size: 12px; color: #888; padding: 10px; text-align: center; } `;