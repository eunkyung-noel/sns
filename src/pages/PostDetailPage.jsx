import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../api/api';
import Swal from 'sweetalert2';

const PostDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false); // 팔로우 상태 추가

    const myId = localStorage.getItem('userId') ? String(localStorage.getItem('userId')) : "";
    const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

    const fetchPost = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/posts/${id}`);
            setPost(res.data);
            // 팔로우 상태 확인 (상대방 ID와 내 팔로잉 목록 비교 로직 필요)
            if (res.data.author?.isFollowing) {
                setIsFollowing(true);
            }
        } catch (err) {
            console.error("게시글 로딩 실패");
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPost(); }, [id]);

    // 팔로우/언팔로우 핸들러
    const handleFollow = async () => {
        if (!myId) return Swal.fire('알림', '로그인이 필요합니다.', 'info');
        if (String(post.authorId) === myId) return; // 자기 자신 팔로우 방지

        try {
            const res = await api.post(`/users/follow/${post.authorId}`);
            setIsFollowing(!isFollowing);
            Swal.fire({
                title: res.data.message,
                icon: 'success',
                timer: 1000,
                showConfirmButton: false
            });
        } catch (err) {
            Swal.fire('오류', '팔로우 처리에 실패했습니다.', 'error');
        }
    };

    const checkIsLiked = (likesArray) => {
        if (!likesArray || !myId) return false;
        return likesArray.some(l => String(typeof l === 'object' ? l.userId : l) === myId);
    };

    const handleLikePost = async () => {
        if (!myId) return Swal.fire('알림', '로그인이 필요합니다.', 'info');
        setPost(prev => {
            const isLiked = checkIsLiked(prev.likes);
            const newLikes = isLiked
                ? prev.likes.filter(l => String(typeof l === 'object' ? l.userId : l) !== myId)
                : [...(prev.likes || []), { userId: myId, postId: id }];
            return { ...prev, likes: newLikes };
        });
        try { await api.post(`/posts/${id}/like`); } catch (err) { fetchPost(); }
    };

    const handleAddComment = async () => {
        if (!commentText.trim()) return;
        try {
            await api.post(`/posts/${id}/comments`, { content: commentText });
            setCommentText('');
            fetchPost();
        } catch (err) { }
    };

    if (loading) return <Container><Loading>🫧 버블 로딩 중...</Loading></Container>;
    if (!post) return null;

    const isPostLiked = checkIsLiked(post.likes);

    return (
        <Container>
            <HeaderNav>
                <BackButton onClick={() => navigate(-1)}>← 돌아가기</BackButton>
            </HeaderNav>

            <PostCard>
                <PostHeader>
                    <Avatar src={post.author?.profilePic ? `${SERVER_URL}${post.author.profilePic}` : `https://ui-avatars.com/api/?name=${post.author?.nickname}&background=74b9ff&color=fff`} />
                    <NameCol>
                        <UserRow>
                            <UserName>@{post.author?.nickname || 'user'}</UserName>
                            {/* ✅ 팔로우 버튼: 내 게시글이 아닐 때만 표시 */}
                            {String(post.authorId) !== myId && (
                                <FollowBtn $following={isFollowing} onClick={handleFollow}>
                                    {isFollowing ? '팔로잉' : '팔로우'}
                                </FollowBtn>
                            )}
                        </UserRow>
                        <TimeText>{new Date(post.createdAt).toLocaleString('ko-KR')}</TimeText>
                    </NameCol>
                    <Spacer />
                    <ReportBtn onClick={() => {}}>🚨 신고</ReportBtn>
                </PostHeader>

                <Content>{post.content}</Content>
                {post.imageUrl && <PostImg src={`${SERVER_URL}${post.imageUrl}`} />}

                <StatRow>
                    <StatItem onClick={handleLikePost} $active={isPostLiked}>
                        <HeartIcon>{isPostLiked ? '❤️' : '🤍'}</HeartIcon>
                        좋아요 {post.likes?.length || 0}
                    </StatItem>
                    <StatItem>💬 댓글 {post.comments?.length || 0}</StatItem>
                </StatRow>
            </PostCard>

            <CommentSection>
                <CommentTitle>댓글 🫧 {post.comments?.length || 0}</CommentTitle>
                <CommentList>
                    {post.comments?.map(comment => (
                        <CommentItem key={comment.id}>
                            <CommentAuthor>@{comment.author?.nickname}</CommentAuthor>
                            <CommentContent>{comment.content}</CommentContent>
                            <CommentSubRow>
                                <CommentLike $active={checkIsLiked(comment.likes)} onClick={() => api.post(`/posts/comments/${comment.id}/like`).then(fetchPost)}>
                                    {checkIsLiked(comment.likes) ? '❤️' : '🤍'} {comment.likes?.length || 0}
                                </CommentLike>
                            </CommentSubRow>
                        </CommentItem>
                    ))}
                </CommentList>

                <InputRow>
                    <CommentInput
                        placeholder="따뜻한 댓글을 남겨주세요..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <SendBtn onClick={handleAddComment}>전송</SendBtn>
                </InputRow>
            </CommentSection>
        </Container>
    );
};

/* --- 스타일 최적화 --- */

const Container = styled.div`
    max-width: 800px; /* 웹 사이즈 확장 */
    margin: 0 auto;
    padding: 40px 20px;
    background: #f0f7ff;
    min-height: 100vh;
`;

const HeaderNav = styled.div` margin-bottom: 20px; `;
const BackButton = styled.span` cursor: pointer; color: #74b9ff; font-weight: bold; &:hover { text-decoration: underline; } `;

const PostCard = styled.div`
    background: white;
    padding: 30px;
    border-radius: 30px;
    box-shadow: 0 10px 30px rgba(116, 185, 255, 0.1);
`;

const PostHeader = styled.div` display: flex; align-items: center; gap: 15px; `;
const Avatar = styled.img` width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #f0f7ff; `;
const NameCol = styled.div` display: flex; flex-direction: column; gap: 4px; `;
const UserRow = styled.div` display: flex; align-items: center; gap: 10px; `;
const UserName = styled.span` font-weight: 800; color: #2d3436; font-size: 17px; `;

/* 팔로우 버튼 스타일 */
const FollowBtn = styled.button`
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid #74b9ff;
    background: ${props => props.$following ? 'white' : '#74b9ff'};
    color: ${props => props.$following ? '#74b9ff' : 'white'};
    &:hover { transform: scale(1.05); }
`;

const Spacer = styled.div` flex: 1; `;
const TimeText = styled.span` font-size: 12px; color: #b2bec3; `;
const ReportBtn = styled.button` background: none; border: none; color: #fab1a0; cursor: pointer; font-size: 13px; `;
const Content = styled.div` font-size: 18px; line-height: 1.7; margin: 25px 0; color: #2d3436; `;
const PostImg = styled.img` width: 100%; border-radius: 25px; margin-top: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); `;

const StatRow = styled.div` display: flex; gap: 20px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #f1f2f6; `;
const StatItem = styled.div`
    display: flex; align-items: center; gap: 8px; cursor: pointer;
    color: ${props => props.$active ? '#ff4757' : '#636e72'};
    font-weight: bold;
`;
const HeartIcon = styled.span` font-size: 20px; `;

const CommentSection = styled.div` margin-top: 40px; `;
const CommentTitle = styled.div` font-size: 18px; font-weight: 800; color: #1a2a6c; margin-bottom: 20px; `;
const CommentList = styled.div` display: flex; flex-direction: column; gap: 12px; `;
const CommentItem = styled.div` background: white; padding: 15px 20px; border-radius: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.02); `;
const CommentAuthor = styled.div` font-size: 13px; font-weight: bold; color: #74b9ff; `;
const CommentContent = styled.div` font-size: 15px; margin-top: 6px; color: #2d3436; `;
const CommentSubRow = styled.div` margin-top: 10px; `;
const CommentLike = styled.span` cursor: pointer; font-size: 12px; color: ${props => props.$active ? '#ff4757' : '#b2bec3'}; `;

const InputRow = styled.div` display: flex; gap: 12px; margin-top: 30px; background: white; padding: 10px; border-radius: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); `;
const CommentInput = styled.input` flex: 1; border: none; padding: 10px 15px; outline: none; font-size: 15px; `;
const SendBtn = styled.button` background: #74b9ff; color: white; border: none; padding: 10px 25px; border-radius: 15px; font-weight: bold; cursor: pointer; `;

const Loading = styled.div` text-align: center; padding: 100px; color: #74b9ff; font-weight: bold; `;

export default PostDetailPage;