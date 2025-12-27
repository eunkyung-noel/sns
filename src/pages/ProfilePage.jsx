import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import api from '../api/api';

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [myPosts, setMyPosts] = useState([]);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                // 내 정보와 내가 쓴 글을 가져오는 API 호출 (백엔드 구현 필요)
                const userRes = await api.get('/auth/me');
                const postsRes = await api.get('/posts/my-posts');
                setUser(userRes.data);
                setMyPosts(postsRes.data);
            } catch (err) {
                console.error("프로필 로딩 실패", err);
            }
        };
        fetchProfileData();
    }, []);

    return (
        <Container>
            <ProfileCard>
                <Avatar>👤</Avatar>
                <UserName>{user?.nickname || '사용자'}</UserName>
                <UserEmail>{user?.email}</UserEmail>
            </ProfileCard>

            <PostGrid>
                <SectionTitle>내가 쓴 게시글</SectionTitle>
                {myPosts.length > 0 ? (
                    myPosts.map(post => (
                        <PostItem key={post.id}>
                            {post.imageUrl && <PostImage src={post.imageUrl} alt="post" />}
                            <PostContent>{post.content}</PostContent>
                        </PostItem>
                    ))
                ) : (
                    <EmptyMsg>작성한 게시글이 없습니다. 🫧</EmptyMsg>
                )}
            </PostGrid>
        </Container>
    );
};

export default ProfilePage;

const Container = styled.div` padding: 20px; max-width: 600px; margin: 0 auto; `;
const ProfileCard = styled.div` background: white; padding: 30px; border-radius: 20px; text-align: center; margin-bottom: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); `;
const Avatar = styled.div` font-size: 50px; margin-bottom: 10px; `;
const UserName = styled.h2` color: #333; margin: 5px 0; `;
const UserEmail = styled.p` color: #888; font-size: 14px; `;
const PostGrid = styled.div` margin-top: 20px; `;
const SectionTitle = styled.h3` color: #74b9ff; margin-bottom: 15px; border-bottom: 2px solid #74b9ff; display: inline-block; `;
const PostItem = styled.div` background: white; padding: 15px; border-radius: 12px; margin-bottom: 10px; `;
const PostImage = styled.img` width: 100%; border-radius: 10px; margin-bottom: 10px; `;
const PostContent = styled.p` font-size: 14px; color: #444; `;
const EmptyMsg = styled.p` text-align: center; color: #aaa; margin-top: 30px; `;