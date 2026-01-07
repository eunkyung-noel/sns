import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../api/api';
import Swal from 'sweetalert2';

const FeedPage = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState('');
    const [commentText, setCommentText] = useState({});
    const [activeMenuId, setActiveMenuId] = useState(null);

    const fileInputRef = useRef(null);
    const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

    // ✅ 타입 일치 (String)
    const myId = localStorage.getItem('userId') ? String(localStorage.getItem('userId')) : null;

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

    const handleDeletePost = async (postId) => {
        const result = await Swal.fire({
            title: '삭제하시겠습니까?',
            icon: 'warning',
            showCancelButton: true,
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

    const handleUpdatePost = async (postId, currentContent) => {
        const { value: text } = await Swal.fire({
            title: '게시글 수정',
            input: 'textarea',
            inputValue: currentContent,
            showCancelButton: true
        });
        if (text) {
            try {
                await api.put(`/posts/${postId}`, { content: text });
                setPosts(prev => prev.map(p => String(p.id) === String(postId) ? { ...p, content: text } : p));
            } catch (err) { Swal.fire('에러', '수정 실패', 'error'); }
        }
    };

    // ✅ 하트(좋아요) 로직 완전 수정
    const handleLikePost = async (e, postId) => {
        e.preventDefault();
        e.stopPropagation();
        if (!myId) {
            Swal.fire('알림', '로그인이 필요합니다.', 'info');
            return;
        }

        // 1. 낙관적 업데이트: UI를 먼저 변경
        setPosts(prev => prev.map(post => {
            if (String(post.id) === String(postId)) {
                const currentLikes = post.likes || [];
                // ✅ 객체 형태(l.userId)와 단순 ID 형태(l) 모두 대응하도록 수정
                const alreadyLiked = currentLikes.some(l => {
                    const userIdInLike = l.userId ? String(l.userId) : String(l);
                    return userIdInLike === myId;
                });

                const newLikes = alreadyLiked
                    ? currentLikes.filter(l => (l.userId ? String(l.userId) : String(l)) !== myId)
                    : [...currentLikes, { userId: myId }];

                return { ...post, likes: newLikes };
            }
            return post;
        }));

        // 2. 서버 요청
        try {
            await api.post(`/posts/${postId}/like`);
        } catch (err) {
            console.error("좋아요 실패");
            fetchPosts(); // 실패 시 원래 데이터로 복구
        }
    };

    const handleAddComment = async (postId) => {
        const text = commentText[postId];
        if (!text?.trim()) return;
        try {
            await api.post(`/posts/${postId}/comments`, { content: text });
            fetchPosts();
            setCommentText(prev => ({ ...prev, [postId]: '' }));
        } catch (err) { console.error('댓글 작성 실패'); }
    };

    const handleDeleteComment = async (postId, commentId) => {
        try {
            await api.delete(`/posts/comments/${commentId}`);
            fetchPosts();
        } catch (err) { Swal.fire('에러', '삭제 실패', 'error'); }
    };

    return (
        <Container>
            <TopBar>
                <Header>🫧 Bubble Feed</Header>
                <NotiBtn onClick={() => navigate('/notifications')}>🔔</NotiBtn>
            </TopBar>

            <InputBox onSubmit={handlePostSubmit}>
                <TextArea value={content} onChange={e => setContent(e.target.value)} placeholder="무슨 생각을 하고 계신가요?" />
                {preview && <PreviewWrapper><Preview src={preview} /><RemovePreview onClick={() => { setImage(null); setPreview(''); }}>✕</RemovePreview></PreviewWrapper>}
                <FileRow><CameraButton type="button" onClick={() => fileInputRef.current.click()}>📸</CameraButton><SubmitBtn type="submit">➕</SubmitBtn></FileRow>
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={e => {
                    const file = e.target.files[0];
                    if (file) { setImage(file); setPreview(URL.createObjectURL(file)); }
                }} />
            </InputBox>

            {posts.map(post => {
                // ✅ 좋아요 여부 판별 로직 수정
                const isLiked = (post.likes || []).some(l => {
                    const userIdInLike = l.userId ? String(l.userId) : String(l);
                    return userIdInLike === myId;
                });
                const isMyPost = String(post.authorId) === myId;

                return (
                    <PostCard key={post.id}>
                        <PostHeader>
                            <UserInfo onClick={() => navigate(`/profile/${post.authorId}`)}>
                                <Avatar src={post.author?.profilePic ? `${SERVER_URL}${post.author.profilePic}` : `https://ui-avatars.com/api/?name=${post.author?.nickname}&background=74b9ff&color=fff`} />
                                <NameCol>
                                    <UserName>@{post.author?.nickname || 'user'}</UserName>
                                    <TimeText>{new Date(post.createdAt).toLocaleString()}</TimeText>
                                </NameCol>
                            </UserInfo>

                            <MenuContainer onClick={(e) => e.stopPropagation()}>
                                <MenuBtn onClick={() => setActiveMenuId(activeMenuId === post.id ? null : post.id)}>⋮</MenuBtn>
                                {activeMenuId === post.id && (
                                    <MenuDropdown>
                                        {isMyPost ? (
                                            <>
                                                <MenuItem onClick={() => handleUpdatePost(post.id, post.content)}>✏️ 수정</MenuItem>
                                                <MenuItem className="delete" onClick={() => handleDeletePost(post.id)}>🗑️ 삭제</MenuItem>
                                            </>
                                        ) : (
                                            <MenuItem onClick={() => Swal.fire('신고', '신고가 접수되었습니다.', 'success')}>🚨 신고</MenuItem>
                                        )}
                                    </MenuDropdown>
                                )}
                            </MenuContainer>
                        </PostHeader>

                        <Content>{post.content}</Content>
                        {post.imageUrl && <PostImg src={`${SERVER_URL}${post.imageUrl}`} />}

                        {/* ✅ 클릭 영역 확실히 보장 */}
                        <ActionRow onClick={(e) => handleLikePost(e, post.id)}>
                            <Heart isLiked={isLiked}>{isLiked ? '❤️' : '🤍'}</Heart>
                            <LikeCount isLiked={isLiked}>{post.likes?.length || 0}</LikeCount>
                        </ActionRow>

                        <CommentSection>
                            {(post.comments || []).map(comment => (
                                <CommentItem key={comment.id}>
                                    <CommentContent>
                                        <div style={{ flex: 1 }}>
                                            <b>{comment.author?.nickname}</b> {comment.content}
                                        </div>
                                        {String(comment.authorId) === myId && (
                                            <CommentIconBtn onClick={() => handleDeleteComment(post.id, comment.id)}>🗑️</CommentIconBtn>
                                        )}
                                    </CommentContent>
                                </CommentItem>
                            ))}
                            <CommentInputRow>
                                <CommentInput
                                    placeholder="댓글 쓰기..."
                                    value={commentText[post.id] || ''}
                                    onChange={e => setCommentText({ ...commentText, [post.id]: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                />
                                <CommentBtn onClick={() => handleAddComment(post.id)}>전송</CommentBtn>
                            </CommentInputRow>
                        </CommentSection>
                    </PostCard>
                );
            })}
        </Container>
    );
};

// --- 스타일 컴포넌트 (동일) ---
const MenuContainer = styled.div` position: relative; `;
const MenuBtn = styled.button` background: none; border: none; font-size: 20px; cursor: pointer; color: #b2bec3; padding: 5px; `;
const MenuDropdown = styled.div` position: absolute; right: 0; top: 30px; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 100; width: 80px; overflow: hidden; `;
const MenuItem = styled.div` padding: 10px; font-size: 13px; cursor: pointer; text-align: center; &:hover { background: #f1f2f6; } &.delete { color: #ff4757; } `;
const Heart = styled.span` font-size: 20px; color: ${props => props.isLiked ? '#ff4757' : '#ccc'}; cursor: pointer; `;
const LikeCount = styled.span` font-size: 14px; font-weight: bold; color: ${props => props.isLiked ? '#ff4757' : '#636e72'}; `;
const Container = styled.div` max-width: 500px; margin: auto; padding: 20px 20px 100px; background-color: #f0f8ff; min-height: 100vh; `;
const TopBar = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; `;
const Header = styled.h1` color: #74b9ff; margin: 0; `;
const NotiBtn = styled.button` background: white; border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 20px; cursor: pointer; `;
const InputBox = styled.form` background: #fff; padding: 20px; border-radius: 25px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); `;
const TextArea = styled.textarea` width: 100%; border: none; outline: none; min-height: 60px; font-size: 16px; resize: none; `;
const FileRow = styled.div` display: flex; justify-content: space-between; margin-top: 10px; `;
const CameraButton = styled.button` background: #f1f2f6; border:none; padding: 8px 15px; border-radius: 12px; cursor:pointer; `;
const SubmitBtn = styled.button` border-radius: 50%; border:none; background:#74b9ff; color:white; width:40px; height:40px; cursor:pointer; font-size: 20px; `;
const PostCard = styled.div` background: #fff; padding: 20px; border-radius: 25px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); `;
const PostHeader = styled.div` display: flex; justify-content: space-between; align-items: center; `;
const UserInfo = styled.div` display: flex; align-items: center; gap: 10px; cursor: pointer; `;
const Avatar = styled.img` width: 35px; height: 35px; border-radius: 50%; object-fit: cover; `;
const NameCol = styled.div` display: flex; flex-direction: column; `;
const UserName = styled.span` font-weight: 700; color: #0984e3; font-size: 14px; `;
const TimeText = styled.span` font-size: 10px; color: #b2bec3; `;
const Content = styled.p` margin: 15px 0; font-size: 15px; color: #2d3436; line-height: 1.5; `;
const PostImg = styled.img` width: 100%; border-radius: 15px; margin-bottom: 10px; `;
const ActionRow = styled.div` display: flex; gap: 6px; cursor: pointer; align-items: center; border-top: 1px solid #f1f2f6; padding-top: 10px; width: fit-content; `;
const PreviewWrapper = styled.div` position: relative; margin: 10px 0; `;
const Preview = styled.img` width: 100px; border-radius: 10px; `;
const RemovePreview = styled.button` position: absolute; top:-5px; left: 90px; background: #ff4757; color:white; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer; `;
const CommentSection = styled.div` margin-top: 15px; background: #f8f9fa; padding: 12px; border-radius: 15px; `;
const CommentItem = styled.div` font-size: 13px; margin-bottom: 10px; border-bottom: 1px solid #f1f2f6; padding-bottom: 8px; `;
const CommentContent = styled.div` display: flex; align-items: center; justify-content: space-between; `;
const CommentIconBtn = styled.button` background:none; border:none; cursor:pointer; font-size: 14px; `;
const CommentInputRow = styled.div` display: flex; gap: 5px; margin-top: 10px; `;
const CommentInput = styled.input` flex: 1; border: 1px solid #dfe6e9; border-radius: 8px; padding: 8px 12px; font-size: 12px; outline: none; `;
const CommentBtn = styled.button` background: #74b9ff; color: white; border: none; border-radius: 8px; padding: 0 12px; font-size: 12px; cursor:pointer; `;

export default FeedPage;