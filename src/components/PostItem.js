import React, { useState } from 'react';
import styled from 'styled-components';
import api from '../api';

const PostItem = ({ post, refreshPosts }) => {
    const [commentText, setCommentText] = useState('');

    const handleCommentSubmit = async () => {
        if (!commentText.trim()) return;

        try {
            // 백엔드 라우터 경로에 맞게 수정 (/posts/:id/comments)
            await api.post(`/posts/${post.id || post._id}/comments`, {
                content: commentText
            });

            setCommentText('');
            refreshPosts();
        } catch (err) {
            alert('댓글 작성 실패');
        }
    };

    return (
        <PostCard>
            {/* 상단: 작성자 정보 (필요시 추가) */}
            <PostHeader>
                <Avatar>{post.author?.nickname?.charAt(0) || '👤'}</Avatar>
                <Nickname>{post.author?.nickname || '익명'}</Nickname>
            </PostHeader>

            {/* 본문 */}
            <PostContent>
                {post.imageUrl && <PostImage src={post.imageUrl} alt="post" />}
                <Text>{post.content}</Text>
            </PostContent>

            {/* 댓글 목록 영역 */}
            <CommentSection>
                {post.comments && post.comments.length > 0 && (
                    <CommentList>
                        {post.comments.map(comment => (
                            <CommentBubble key={comment.id || comment._id}>
                                <strong>{comment.author?.nickname || '익명'}:</strong> {comment.content}
                            </CommentBubble>
                        ))}
                    </CommentList>
                )}
            </CommentSection>

            {/* 댓글 입력창 */}
            <InputWrapper>
                <CommentInput
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="따뜻한 댓글을 남겨주세요..."
                />
                <SubmitBtn onClick={handleCommentSubmit} disabled={!commentText.trim()}>
                    게시
                </SubmitBtn>
            </InputWrapper>
        </PostCard>
    );
};

export default PostItem;

/* --- 스타일 수정 (웹 최적화) --- */

const PostCard = styled.div`
    background: white;
    border: 1px solid #dbdbdb;
    border-radius: 8px;
    margin-bottom: 30px;
    width: 100%;
    max-width: 700px; 
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

const PostHeader = styled.div`
    padding: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-bottom: 1px solid #fafafa;
`;

const Avatar = styled.div`
    width: 32px;
    height: 32px;
    background: #74b9ff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
`;

const Nickname = styled.span`
    font-weight: 600;
    font-size: 14px;
`;

const PostContent = styled.div`
    width: 100%;
`;

const PostImage = styled.img`
    width: 100%;
    max-height: 600px;
    object-fit: cover;
`;

const Text = styled.p`
    padding: 15px;
    font-size: 15px;
    line-height: 1.5;
    margin: 0;
`;

const CommentSection = styled.div`
    padding: 0 15px;
    background: #fdfdfd;
`;

const CommentList = styled.div`
    padding: 10px 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-top: 1px solid #f0f0f0;
`;

const CommentBubble = styled.div`
    font-size: 14px;
    line-height: 1.4;
    strong { margin-right: 5px; }
`;

const InputWrapper = styled.div`
    display: flex;
    align-items: center;
    padding: 10px 15px;
    border-top: 1px solid #efefef;
`;

const CommentInput = styled.input`
    flex: 1;
    border: none;
    outline: none;
    font-size: 14px;
    padding: 8px 0;
`;

const SubmitBtn = styled.button`
    background: none;
    border: none;
    color: #0095f6;
    font-weight: 600;
    cursor: pointer;
    padding: 5px;
    &:disabled { opacity: 0.3; cursor: default; }
`;