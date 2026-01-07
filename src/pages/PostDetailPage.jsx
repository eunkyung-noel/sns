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

    // ✅ 내 ID 확인 및 비교 안전성 확보
    const myId = localStorage.getItem('userId') ? String(localStorage.getItem('userId')) : "";
    const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

    const fetchPost = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/posts/${id}`);
            setPost(res.data);
        } catch (err) {
            console.error("게시글 로딩 실패");
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPost(); }, [id]);

    // ✅ 좋아요 판별 함수 (객체와 문자열 모두 대응)
    const checkIsLiked = (likesArray) => {
        if (!likesArray || !myId) return false;
        return likesArray.some(l => String(typeof l === 'object' ? l.userId : l) === myId);
    };

    // 게시글 신고
    const handleReportPost = async () => {
        const { value: reason } = await Swal.fire({
            title: '게시글 신고',
            input: 'select',
            inputOptions: { '부적절한 홍보': '부적절한 홍보', '욕설 및 비하': '욕설 및 비하', '음란물': '음란물', '기타': '기타' },
            inputPlaceholder: '신고 사유를 선택하세요',
            showCancelButton: true,
            confirmButtonText: '신고하기',
            confirmButtonColor: '#d63031'
        });
        if (reason) {
            try {
                const res = await api.post(`/posts/${id}/report`, { reason });
                Swal.fire('신고 접수', res.data.message, 'success');
            } catch (err) {
                Swal.fire('오류', '신고 실패', 'error');
            }
        }
    };

    // 게시글 좋아요 (낙관적 업데이트 포함)
    const handleLikePost = async () => {
        if (!myId) return Swal.fire('알림', '로그인이 필요합니다.', 'info');

        // UI 즉시 변경
        setPost(prev => {
            const isLiked = checkIsLiked(prev.likes);
            const newLikes = isLiked
                ? prev.likes.filter(l => String(typeof l === 'object' ? l.userId : l) !== myId)
                : [...(prev.likes || []), { userId: myId, postId: id }];
            return { ...prev, likes: newLikes };
        });

        try {
            await api.post(`/posts/${id}/like`);
        } catch (err) {
            fetchPost(); // 실패 시 롤백
        }
    };

    const handleAddComment = async () => {
        if (!commentText.trim()) return;
        try {
            await api.post(`/posts/${id}/comments`, { content: commentText });
            setCommentText('');
            fetchPost();
        } catch (err) { }
    };

    const handleDeleteComment = async (commentId) => {
        const confirm = await Swal.fire({ title: '댓글을 삭제할까요?', icon: 'warning', showCancelButton: true });
        if (confirm.isConfirmed) {
            try {
                await api.delete(`/posts/comments/${commentId}`);
                fetchPost();
            } catch (err) { }
        }
    };

    if (loading) return <Container>🫧 로딩 중...</Container>;
    if (!post) return null;

    const isPostLiked = checkIsLiked(post.likes);

    return (
        <Container>
            <BackButton onClick={() => navigate(-1)}>← 돌아가기</BackButton>

            <PostCard>
                <PostHeader>
                    <Avatar src={post.author?.profilePic ? `${SERVER_URL}${post.author.profilePic}` : `https://ui-avatars.com/api/?name=${post.author?.nickname}&background=74b9ff&color=fff`} />
                    <NameCol style={{ flex: 1 }}>
                        <UserName>@{post.author?.nickname || 'user'}</UserName>
                        <TimeText>{new Date(post.createdAt).toLocaleString('ko-KR')}</TimeText>
                    </NameCol>
                    <ReportBtn onClick={handleReportPost}>🚨 신고</ReportBtn>
                </PostHeader>

                <Content>{post.content}</Content>
                {post.imageUrl && <PostImg src={`${SERVER_URL}${post.imageUrl}`} />}

                <StatRow>
                    {/* ✅ $active 프롭 전달로 색상 제어 */}
                    <StatItem onClick={handleLikePost} style={{ cursor: 'pointer' }} $active={isPostLiked}>
                        <HeartIcon className="heart">{isPostLiked ? '❤️' : '🤍'}</HeartIcon>
                        <span className="count">좋아요 {post.likes?.length || 0}</span>
                    </StatItem>
                    <StatItem>💬 댓글 {post.comments?.length || 0}</StatItem>
                </StatRow>
            </PostCard>

            <CommentSection>
                <CommentTitle>댓글 🫧 {post.comments?.length || 0}</CommentTitle>
                {post.comments?.map(comment => {
                    const isCommentLiked = checkIsLiked(comment.likes);
                    return (
                        <CommentItem key={comment.id}>
                            <div style={{ flex: 1 }}>
                                <CommentAuthor>@{comment.author?.nickname}</CommentAuthor>
                                <CommentContent>{comment.content}</CommentContent>
                                <CommentSubRow>
                                    <CommentLike $active={isCommentLiked} onClick={() => api.post(`/posts/comments/${comment.id}/like`).then(fetchPost)}>
                                        {isCommentLiked ? '❤️' : '🤍'} {comment.likes?.length || 0}
                                    </CommentLike>
                                    <span style={{ cursor: 'pointer', color: '#fab1a0', marginLeft: '10px' }}>신고</span>
                                </CommentSubRow>
                            </div>
                            {String(comment.authorId) === myId && (
                                <CommentMenu>
                                    <small onClick={() => handleDeleteComment(comment.id)}>🗑️</small>
                                </CommentMenu>
                            )}
                        </CommentItem>
                    );
                })}

                <InputRow>
                    <CommentInput
                        placeholder="댓글을 입력하세요..."
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

// --- 스타일 컴포넌트 수정 ---
const Container = styled.div` max-width: 500px; margin: auto; padding: 20px; background: #f0f8ff; min-height: 100vh; `;
const BackButton = styled.div` cursor: pointer; color: #74b9ff; font-weight: bold; margin-bottom: 20px; font-size: 14px; `;
const PostCard = styled.div` background: #fff; padding: 20px; border-radius: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); `;
const PostHeader = styled.div` display: flex; gap: 10px; align-items: center; margin-bottom: 15px; `;
const Avatar = styled.img` width: 40px; height: 40px; border-radius: 50%; object-fit: cover; `;
const NameCol = styled.div` display: flex; flex-direction: column; `;
const UserName = styled.span` font-weight: bold; color: #2d3436; font-size: 15px; `;
const TimeText = styled.span` font-size: 11px; color: #b2bec3; `;
const ReportBtn = styled.button` background: #fff5f5; color: #ff7675; border: 1px solid #fab1a0; border-radius: 8px; padding: 4px 8px; font-size: 12px; cursor: pointer; &:hover { background: #ff7675; color: white; } `;
const Content = styled.div` font-size: 16px; line-height: 1.6; margin: 15px 0; color: #2d3436; white-space: pre-wrap; `;
const PostImg = styled.img` width: 100%; border-radius: 15px; margin-top: 10px; `;

// ✅ 게시글 좋아요 상태에 따른 색상 변경
const StatRow = styled.div` display: flex; gap: 20px; margin-top: 20px; padding-top: 15px; border-top: 1px solid #f1f2f6; `;
const StatItem = styled.div` 
    display: flex; align-items: center; gap: 5px; font-size: 14px; 
    color: ${props => props.$active ? '#ff4757' : '#636e72'};
    font-weight: ${props => props.$active ? 'bold' : 'normal'};
    .heart { transform: ${props => props.$active ? 'scale(1.1)' : 'scale(1)'}; transition: 0.2s; }
`;

const HeartIcon = styled.span` font-size: 18px; `;
const CommentSection = styled.div` margin-top: 25px; `;
const CommentTitle = styled.div` font-weight: bold; margin-bottom: 15px; color: #74b9ff; font-size: 15px; `;
const CommentItem = styled.div` background: #fff; padding: 12px 15px; border-radius: 15px; margin-bottom: 10px; display: flex; align-items: flex-start; justify-content: space-between; box-shadow: 0 2px 5px rgba(0,0,0,0.02); `;
const CommentAuthor = styled.div` font-size: 12px; font-weight: bold; color: #0984e3; `;
const CommentContent = styled.div` font-size: 14px; margin-top: 4px; color: #2d3436; `;
const CommentSubRow = styled.div` font-size: 11px; color: #aaa; margin-top: 8px; display: flex; align-items: center; `;

// ✅ 댓글 좋아요 상태 색상 전용
const CommentLike = styled.span`
    cursor: pointer;
    color: ${props => props.$active ? '#ff4757' : 'inherit'};
    font-weight: ${props => props.$active ? 'bold' : 'normal'};
`;

const CommentMenu = styled.div` display: flex; gap: 8px; cursor: pointer; opacity: 0.6; margin-top: 5px; `;
const InputRow = styled.div` display: flex; gap: 10px; margin-top: 20px; `;
const CommentInput = styled.input` flex: 1; padding: 12px 15px; border: 1px solid #dfe6e9; border-radius: 12px; outline: none; font-size: 14px; `;
const SendBtn = styled.button` background: #74b9ff; color: white; border: none; padding: 0 20px; border-radius: 12px; font-weight: bold; cursor: pointer; font-size: 14px; `;

export default PostDetailPage;