import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../api/api';
import Swal from 'sweetalert2';

const PostDetailPage = () => {
    const { postId } = useParams();
    const [post, setPost] = useState(null);
    const [comment, setComment] = useState('');
    const navigate = useNavigate();

    const SERVER_URL = 'http://localhost:5001';

    useEffect(() => {
        fetchDetail();
    }, [postId]);

    const fetchDetail = async () => {
        try {
            const response = await api.get(`/api/posts/${postId}`);
            setPost(response.data);
        } catch (err) {
            Swal.fire('에러', '비눗방울을 불러오지 못했습니다.', 'error');
            navigate('/feed');
        }
    };

    const handleCommentSubmit = async () => {
        if (!comment.trim()) return;
        try {
            await api.post(`/api/posts/${postId}/comment`, { content: comment });
            setComment('');
            fetchDetail();
        } catch (err) {
            Swal.fire('에러', '댓글 작성 실패', 'error');
        }
    };

    if (!post) return <LoadingContainer>🫧 방울 띄우는 중...</LoadingContainer>;

    return (
        <Container>
            <BackBtn onClick={() => navigate(-1)}>← 돌아가기</BackBtn>

            <BubbleCard>
                <Header>
                    <Avatar src={post.author?.profilePic ? `${SERVER_URL}${post.author.profilePic}` : 'https://via.placeholder.com/40'} />
                    <UserInfo>
                        <Name>{post.author?.name || '익명 방울'}</Name>
                        <DateText>{new Date(post.createdAt).toLocaleDateString()}</DateText>
                    </UserInfo>
                </Header>

                <Content>{post.content}</Content>

                {post.image && (
                    <PostImg src={`${SERVER_URL}${post.image}`} alt="bubble-content" />
                )}

                <Divider />

                <CommentSection>
                    <CommentTitle>댓글 🫧 {post.comments?.length || 0}</CommentTitle>
                    <CommentList>
                        {post.comments?.map((c, i) => (
                            <CommentItem key={i}>
                                <div className="c-author">{c.author?.name || '익명'}</div>
                                <div className="c-content">{c.content}</div>
                            </CommentItem>
                        ))}
                    </CommentList>

                    <InputGroup>
                        <CommentInput
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="따뜻한 한마디를 남겨주세요..."
                        />
                        <SendBtn onClick={handleCommentSubmit}>발사</SendBtn>
                    </InputGroup>
                </CommentSection>
            </BubbleCard>
        </Container>
    );
};

export default PostDetailPage;

/* --- Bubble UI Styles --- */

const Container = styled.div`
    padding: 30px 20px;
    max-width: 600px;
    margin: 0 auto;
    min-height: 100vh;
`;

const BackBtn = styled.button`
    background: #e1f5fe;
    border: none;
    color: #03a9f4;
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: bold;
    cursor: pointer;
    margin-bottom: 20px;
    transition: 0.3s;
    &:hover { background: #b3e5fc; }
`;

const BubbleCard = styled.div`
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    padding: 30px;
    border-radius: 40px; /* 더 둥글게 */
    box-shadow: 0 15px 35px rgba(116, 185, 255, 0.15);
    border: 2px solid #ffffff;
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 25px;
`;

const Avatar = styled.img`
    width: 45px;
    height: 45px;
    border-radius: 50%;
    margin-right: 15px;
    border: 2px solid #74b9ff;
    padding: 2px;
`;

const UserInfo = styled.div` display: flex; flex-direction: column; `;
const Name = styled.span` font-weight: bold; color: #333; font-size: 16px; `;
const DateText = styled.span` font-size: 12px; color: #aaa; `;

const Content = styled.p`
    line-height: 1.8;
    color: #444;
    font-size: 16px;
    white-space: pre-wrap;
    margin-bottom: 20px;
`;

const PostImg = styled.img`
    width: 100%;
    border-radius: 30px;
    margin-bottom: 25px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.05);
`;

const Divider = styled.div`
    height: 1.5px;
    background: linear-gradient(to right, transparent, #e3f2fd, transparent);
    margin: 30px 0;
`;

const CommentSection = styled.div``;
const CommentTitle = styled.h4` color: #74b9ff; margin-bottom: 20px; display: flex; align-items: center; gap: 5px; `;

const CommentList = styled.div`
    margin-bottom: 25px;
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const CommentItem = styled.div`
    background: #f8fbff;
    padding: 12px 18px;
    border-radius: 20px;
    .c-author { font-weight: bold; font-size: 13px; color: #74b9ff; margin-bottom: 4px; }
    .c-content { font-size: 14px; color: #555; }
`;

const InputGroup = styled.div`
    display: flex;
    background: #f0f7ff;
    padding: 8px;
    border-radius: 30px;
    border: 1px solid #e1f0ff;
`;

const CommentInput = styled.input`
    flex: 1;
    background: none;
    border: none;
    padding: 10px 15px;
    outline: none;
    font-size: 14px;
`;

const SendBtn = styled.button`
    background: #74b9ff;
    color: white;
    border: none;
    padding: 10px 25px;
    border-radius: 25px;
    font-weight: bold;
    cursor: pointer;
    transition: 0.3s;
    &:hover { background: #0984e3; transform: scale(1.05); }
`;

const LoadingContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 80vh;
    color: #74b9ff;
    font-weight: bold;
`;