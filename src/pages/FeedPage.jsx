import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../api/api';
import Swal from 'sweetalert2';
import EditPostModal from './EditPostModal';

const FeedPage = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState('');
    const [commentText, setCommentText] = useState({});
    const [activeMenuId, setActiveMenuId] = useState(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState(null);

    const fileInputRef = useRef(null);
    const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
    const myId = localStorage.getItem('userId') ? String(localStorage.getItem('userId')) : null;

    const filterToBubbles = (text) => {
        if (!text || typeof text !== 'string') return text;
        const badWords = ['ㅅㅂ', '시발', '씨발', 'ㅄ', '병신', 'ㅅㄲ', '새끼', '존나', 'ㅈㄴ', '개새끼', '미친', '바보', '멍청이'];
        let filteredText = text;
        badWords.forEach(word => {
            const regex = new RegExp(word, 'gi');
            filteredText = filteredText.replace(regex, '🫧'.repeat(word.length));
        });
        return filteredText;
    };

    const fetchPosts = async () => {
        try {
            const res = await api.get('/posts');
            setPosts(res.data || []);
        } catch (err) { console.error('피드 로딩 실패'); }
    };

    useEffect(() => {
        fetchPosts();
        const closeMenu = () => setActiveMenuId(null);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() && !image) return;
        const formData = new FormData();
        formData.append('content', content);
        if (image) formData.append('image', image);
        try {
            await api.post('/posts', formData);
            fetchPosts();
            setContent(''); setImage(null); setPreview('');
        } catch (err) { Swal.fire('에러', '게시글 작성 실패', 'error'); }
    };

    const handleEditClick = (post) => {
        setEditingPost(post);
        setIsEditModalOpen(true);
        setActiveMenuId(null);
    };

    const handleDeletePost = async (postId) => {
        const result = await Swal.fire({
            title: '게시글 삭제',
            text: '이 버블을 터뜨릴까요? 🫧',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff7675',
            confirmButtonText: '삭제',
            cancelButtonText: '취소'
        });
        if (result.isConfirmed) {
            try {
                await api.delete(`/posts/${postId}`);
                setPosts(prev => prev.filter(p => String(p.id) !== String(postId)));
                Swal.fire('완료', '삭제되었습니다.', 'success');
            } catch (err) { Swal.fire('에러', '삭제 실패', 'error'); }
        }
    };

    const handleLikePost = async (e, postId) => {
        e.preventDefault();
        e.stopPropagation();
        if (!myId) return Swal.fire('알림', '로그인이 필요합니다.', 'info');

        setPosts(prev => prev.map(post => {
            if (String(post.id) === String(postId)) {
                const isLiked = (post.likes || []).some(l => String(l.userId || l) === myId);
                const updatedLikes = isLiked
                    ? post.likes.filter(l => String(l.userId || l) !== myId)
                    : [...(post.likes || []), { userId: myId }];
                return { ...post, likes: updatedLikes };
            }
            return post;
        }));

        try {
            const res = await api.post(`/posts/${postId}/like`);
            const serverLikes = res.data.likes || res.data;
            if (Array.isArray(serverLikes)) {
                setPosts(prev => prev.map(post =>
                    String(post.id) === String(postId) ? { ...post, likes: serverLikes } : post
                ));
            }
        } catch (err) {
            console.error('좋아요 실패');
            fetchPosts();
        }
    };

    const handleAddComment = async (postId) => {
        const text = commentText[postId];
        if (!text?.trim()) return;
        try {
            await api.post(`/posts/${postId}/comments`, { content: text }); // 경로 수정
            fetchPosts();
            setCommentText(prev => ({ ...prev, [postId]: '' }));
        } catch (err) { console.error('댓글 작성 실패'); }
    };

    const handleLikeComment = async (commentId) => {
        if (!myId) return Swal.fire('알림', '로그인이 필요합니다.', 'info');
        try {
            await api.post(`/posts/comments/${commentId}/like`); // 경로 수정
            fetchPosts();
        } catch (err) { console.error('댓글 좋아요 실패'); }
    };

    const handleUpdateComment = async (commentId, currentContent) => {
        const { value: text } = await Swal.fire({
            title: '댓글 수정',
            input: 'textarea',
            inputValue: currentContent,
            showCancelButton: true,
            confirmButtonColor: '#74b9ff',
        });
        if (text) {
            try {
                await api.put(`/comments/${commentId}`, { content: text });
                fetchPosts();
            } catch (err) { Swal.fire('에러', '수정 실패', 'error'); }
        }
    };

    const handleDeleteComment = async (commentId) => {
        const result = await Swal.fire({
            title: '댓글 삭제?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff4757'
        });
        if (result.isConfirmed) {
            try {
                await api.delete(`/comments/${commentId}`);
                fetchPosts();
            } catch (err) { Swal.fire('에러', '댓글 삭제 실패', 'error'); }
        }
    };

    return (
        <Container>
            <TopBar>
                <Header onClick={() => window.location.reload()}>🫧 Bubble Feed</Header>
                <NotiBtn onClick={() => navigate('/notifications')}>🔔</NotiBtn>
            </TopBar>

            <InputBox onSubmit={handlePostSubmit}>
                <TextArea value={content} onChange={e => setContent(e.target.value)} placeholder="당신의 일상을 공유해보세요... 🫧" />
                {preview && (
                    <PreviewWrapper>
                        <Preview src={preview} />
                        <RemovePreview onClick={() => { setImage(null); setPreview(''); }}>✕</RemovePreview>
                    </PreviewWrapper>
                )}
                <FileRow>
                    <CameraButton type="button" onClick={() => fileInputRef.current.click()}>📸 사진 첨부</CameraButton>
                    <SubmitBtn type="submit" disabled={!content.trim() && !image}>게시하기</SubmitBtn>
                </FileRow>
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={e => {
                    const file = e.target.files[0];
                    if (file) { setImage(file); setPreview(URL.createObjectURL(file)); }
                }} />
            </InputBox>

            {posts.map(post => {
                const isLiked = (post.likes || []).some(l => String(l.userId || l) === myId);
                const isMyPost = String(post.authorId) === myId;

                return (
                    <PostCard key={post.id}>
                        <PostHeader>
                            <UserInfo onClick={() => navigate(`/profile/${post.authorId}`)}>
                                <Avatar src={post.author?.profilePic ? `${SERVER_URL}${post.author.profilePic}` : `https://ui-avatars.com/api/?name=${post.author?.nickname}&background=74b9ff&color=fff`} />
                                <NameCol>
                                    <UserName>@{post.author?.nickname || 'anonymous'}</UserName>
                                    <TimeText>{new Date(post.createdAt).toLocaleString()}</TimeText>
                                </NameCol>
                            </UserInfo>

                            <MenuContainer onClick={(e) => e.stopPropagation()}>
                                <MenuBtn onClick={() => setActiveMenuId(activeMenuId === post.id ? null : post.id)}>⋮</MenuBtn>
                                {activeMenuId === post.id && (
                                    <MenuDropdown>
                                        {isMyPost ? (
                                            <>
                                                <MenuItem onClick={() => handleEditClick(post)}>✏️ 수정</MenuItem>
                                                <MenuItem className="delete" onClick={() => handleDeletePost(post.id)}>🗑️ 삭제</MenuItem>
                                            </>
                                        ) : (
                                            <MenuItem onClick={() => Swal.fire('신고', '정상 접수되었습니다.', 'success')}>🚨 신고</MenuItem>
                                        )}
                                    </MenuDropdown>
                                )}
                            </MenuContainer>
                        </PostHeader>

                        <Content>{filterToBubbles(post.content)}</Content>
                        {post.imageUrl && <PostImg src={`${SERVER_URL}${post.imageUrl}`} />}

                        <ActionRow>
                            <LikeBtn onClick={(e) => handleLikePost(e, post.id)}>
                                <Heart $isLiked={isLiked}>{isLiked ? '❤️' : '🤍'}</Heart>
                                <LikeCount $isLiked={isLiked}>{post.likes?.length || 0}</LikeCount>
                            </LikeBtn>
                        </ActionRow>

                        <CommentSection>
                            {(post.comments || []).map(comment => {
                                const isCommentLiked = (comment.likes || []).some(l => String(l.userId || l) === myId);
                                return (
                                    <CommentItem key={comment.id}>
                                        <CommentContent>
                                            <AvatarSmall src={comment.author?.profilePic ? `${SERVER_URL}${comment.author.profilePic}` : `https://ui-avatars.com/api/?name=${comment.author?.nickname}&background=74b9ff&color=fff`} />
                                            <CommentBubbleWrapper>
                                                <CommentBubble>
                                                    <CommentUser>@{comment.author?.nickname}</CommentUser>
                                                    <CommentText>{filterToBubbles(comment.content)}</CommentText>
                                                </CommentBubble>
                                                <CommentActionRow>
                                                    <CommentActionItem onClick={() => handleLikeComment(comment.id)} $active={isCommentLiked}>
                                                        {isCommentLiked ? '❤️' : '🤍'} {comment.likes?.length || 0}
                                                    </CommentActionItem>
                                                    {String(comment.authorId) === myId && (
                                                        <>
                                                            <CommentActionItem onClick={() => handleUpdateComment(comment.id, comment.content)}>✏️</CommentActionItem>
                                                            <CommentActionItem onClick={() => handleDeleteComment(comment.id)} className="delete">🗑️</CommentActionItem>
                                                        </>
                                                    )}
                                                </CommentActionRow>
                                            </CommentBubbleWrapper>
                                        </CommentContent>
                                    </CommentItem>
                                );
                            })}
                            <CommentInputRow>
                                <CommentInput
                                    placeholder="댓글 달기..."
                                    value={commentText[post.id] || ''}
                                    onChange={e => setCommentText({ ...commentText, [post.id]: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                />
                                <CommentBtn onClick={() => handleAddComment(post.id)}>게시</CommentBtn>
                            </CommentInputRow>
                        </CommentSection>
                    </PostCard>
                );
            })}

            {isEditModalOpen && (
                <EditPostModal
                    post={editingPost}
                    onClose={() => setIsEditModalOpen(false)}
                    onUpdate={() => {
                        fetchPosts();
                        setIsEditModalOpen(false);
                    }}
                />
            )}
        </Container>
    );
};

/* --- 스타일 정의 (수정 완료) --- */
const Container = styled.div` max-width: 900px; margin: auto; padding: 60px 20px 120px; background-color: #f8fbff; min-height: 100vh; `;
const TopBar = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; `;
const Header = styled.h1` color: #74b9ff; font-size: 38px; cursor: pointer; letter-spacing: -1px; `;
const NotiBtn = styled.button` background: white; border: none; border-radius: 20px; width: 60px; height: 60px; font-size: 28px; cursor: pointer; box-shadow: 0 8px 20px rgba(116, 185, 255, 0.15); `;
const InputBox = styled.form` background: #fff; padding: 40px; border-radius: 35px; margin-bottom: 50px; box-shadow: 0 15px 40px rgba(0,0,0,0.03); `;
const TextArea = styled.textarea` width: 100%; border: none; outline: none; min-height: 120px; font-size: 20px; color: #2d3436; resize: none; `;
const FileRow = styled.div` display: flex; justify-content: space-between; align-items: center; margin-top: 25px; `;
const CameraButton = styled.button` background: #f1f2f6; border:none; padding: 14px 24px; border-radius: 18px; cursor:pointer; font-weight: 700; color: #636e72; transition: 0.2s; &:hover { background: #e2e2e2; } `;
const SubmitBtn = styled.button` border-radius: 18px; border:none; background:#74b9ff; color:white; padding: 14px 45px; cursor:pointer; font-size: 18px; font-weight: 800; transition: 0.3s; &:hover { background: #0984e3; transform: translateY(-2px); } &:disabled { background: #dfe6e9; cursor: default; transform: none; } `;
const PostCard = styled.div` background: #fff; padding: 45px; border-radius: 40px; margin-bottom: 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.02); `;
const PostHeader = styled.div` display: flex; justify-content: space-between; align-items: center; `;
const UserInfo = styled.div` display: flex; align-items: center; gap: 20px; cursor: pointer; `;
const Avatar = styled.img` width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid #f1f2f6; `;
const AvatarSmall = styled.img` width: 35px; height: 35px; border-radius: 50%; object-fit: cover; margin-top: 5px; `;
const NameCol = styled.div` display: flex; flex-direction: column; `;
const UserName = styled.span` font-weight: 800; color: #2d3436; font-size: 18px; `;
const TimeText = styled.span` font-size: 13px; color: #b2bec3; `;
const Content = styled.p` margin: 30px 0; font-size: 20px; color: #2d3436; line-height: 1.8; `;
const PostImg = styled.img` width: 100%; border-radius: 30px; margin-bottom: 25px; `;
const ActionRow = styled.div` border-top: 1.5px solid #f8f9fa; padding-top: 20px; display: flex; gap: 20px; `;
const LikeBtn = styled.div` display: flex; align-items: center; gap: 8px; cursor: pointer; `;

// [Fact] Transient props ($) 적용: isLiked -> $isLiked
const Heart = styled.span` font-size: 30px; color: ${props => props.$isLiked ? '#ff4757' : '#ccc'}; transition: 0.2s; &:hover { transform: scale(1.1); } `;
const LikeCount = styled.span` font-size: 18px; font-weight: 800; color: ${props => props.$isLiked ? '#ff4757' : '#636e72'}; `;

const CommentSection = styled.div` margin-top: 30px; background: #fbfcfe; padding: 30px; border-radius: 30px; `;
const CommentItem = styled.div` margin-bottom: 20px; `;
const CommentContent = styled.div` display: flex; gap: 12px; `;
const CommentBubbleWrapper = styled.div` flex: 1; display: flex; flex-direction: column; gap: 5px; `;
const CommentBubble = styled.div` background: #fff; padding: 12px 18px; border-radius: 0 20px 20px 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); `;
const CommentUser = styled.b` color: #0984e3; font-size: 14px; display: block; margin-bottom: 2px; `;
const CommentText = styled.span` color: #636e72; font-size: 15px; line-height: 1.4; `;
const CommentActionRow = styled.div` display: flex; gap: 15px; padding-left: 5px; `;

// [Fact] Transient props ($) 적용: active -> $active
const CommentActionItem = styled.span` font-size: 13px; color: ${props => props.$active ? '#ff4757' : '#b2bec3'}; cursor: pointer; font-weight: bold; &:hover { color: #74b9ff; } &.delete:hover { color: #ff4757; } `;

const CommentInputRow = styled.div` display: flex; gap: 15px; margin-top: 25px; `;
const CommentInput = styled.input` flex: 1; border: 2px solid #f1f2f6; border-radius: 18px; padding: 15px 20px; font-size: 16px; outline: none; transition: 0.2s; &:focus { border-color: #74b9ff; background: white; } `;
const CommentBtn = styled.button` background: #74b9ff; color: white; border: none; border-radius: 18px; padding: 0 30px; font-size: 16px; font-weight: 800; cursor:pointer; `;
const MenuContainer = styled.div` position: relative; `;
const MenuBtn = styled.button` background: none; border: none; font-size: 30px; cursor: pointer; color: #dfe6e9; `;
const MenuDropdown = styled.div` position: absolute; right: 0; top: 40px; background: white; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); z-index: 100; width: 130px; overflow: hidden; `;
const MenuItem = styled.div` padding: 15px; font-size: 15px; cursor: pointer; text-align: center; &:hover { background: #f8fbff; color: #74b9ff; } &.delete { color: #ff7675; } `;
const PreviewWrapper = styled.div` position: relative; margin: 20px 0; `;
const Preview = styled.img` width: 250px; border-radius: 25px; box-shadow: 0 10px 20px rgba(0,0,0,0.05); `;
const RemovePreview = styled.button` position: absolute; top:-10px; left: 235px; background: #ff4757; color:white; border:none; border-radius:50%; width:30px; height:30px; cursor:pointer; font-weight: bold; `;

export default FeedPage;