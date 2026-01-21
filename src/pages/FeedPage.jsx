import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import api from '../api/api';
import Swal from 'sweetalert2';
import EditPostModal from './EditPostModal';

const bubbleShake = keyframes`
  0%, 100% { border-radius: 60% 40% 70% 30% / 40% 50% 60% 50%; }
  50% { border-radius: 40% 60% 30% 70% / 50% 40% 50% 60%; }
`;

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

    const badWords = ['ㅅㅂ', '시발', '씨발', 'ㅄ', '병신', 'ㅅㄲ', '새끼', '존나', 'ㅈㄴ', '개새끼', '미친', '바보', '멍청이'];

    const getFullImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('data:')) return path;
        const baseUrl = SERVER_URL.endsWith('/') ? SERVER_URL.slice(0, -1) : SERVER_URL;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${baseUrl}${cleanPath}?v=${new Date().getTime()}`;
    };

    const filterToBubbles = (text) => {
        if (!text || typeof text !== 'string') return text;
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

        const hasBadWord = badWords.some(word => content.includes(word));
        const filteredContent = filterToBubbles(content);

        if (hasBadWord) {
            await Swal.fire({
                title: '경고 ⚠️',
                text: '이 문장에는 부정적인 단어가 포함되어 있습니다. 부정적인 단어는 🫧🫧로 표시됩니다.',
                icon: 'warning',
                confirmButtonColor: '#ff7675'
            });
        }

        const formData = new FormData();
        formData.append('content', filteredContent);
        if (image) formData.append('image', image);

        try {
            await api.post('/posts', formData);
            Swal.fire({
                title: '업로드 성공! ✨',
                text: '성공적으로 게시되었습니다.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            setContent(''); setImage(null); setPreview('');
            fetchPosts();
        } catch (err) {
            Swal.fire('에러', '게시글 작성 실패', 'error');
        }
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

    // [Fact] 추가된 게시글 신고 처리 핸들러
    const handleReportPost = async (postId) => {
        setActiveMenuId(null); // 메뉴 닫기

        const { value: reason } = await Swal.fire({
            title: '신고 사유 선택',
            input: 'select',
            inputOptions: {
                '부적절한 콘텐츠': '부적절한 콘텐츠',
                '스팸/도배': '스팸/도배',
                '욕설/비하발언': '욕설/비하발언',
                '기타': '기타'
            },
            inputPlaceholder: '사유를 선택해주세요',
            showCancelButton: true,
            confirmButtonColor: '#ff7675',
            confirmButtonText: '신고 접수',
            cancelButtonText: '취소'
        });

        if (reason) {
            try {
                // 백엔드 엔드포인트 POST /api/posts/:id/report 호출
                await api.post(`/posts/${postId}/report`, { reason });
                Swal.fire({
                    title: '접수 완료',
                    text: '신고가 정상적으로 접수되었습니다.',
                    icon: 'success',
                    confirmButtonColor: '#74c0fc'
                });
            } catch (err) {
                const errMsg = err.response?.data?.message || "신고 처리 중 오류 발생";
                Swal.fire('오류', errMsg, 'error');
            }
        }
    };

    const handleLikePost = async (e, postId) => {
        e.preventDefault(); e.stopPropagation();
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
        } catch (err) { fetchPosts(); }
    };

    const handleAddComment = async (postId) => {
        const text = commentText[postId];
        if (!text?.trim()) return;

        const hasBadWord = badWords.some(word => text.includes(word));
        const filteredText = filterToBubbles(text);

        if (hasBadWord) {
            await Swal.fire({
                title: '경고 ⚠️',
                text: '댓글에 부정적인 단어가 포함되어 있습니다. 부정적인 단어는 🫧🫧로 표시됩니다.',
                icon: 'warning',
                confirmButtonColor: '#ff7675'
            });
        }

        try {
            await api.post(`/posts/${postId}/comments`, { content: filteredText });
            fetchPosts();
            setCommentText(prev => ({ ...prev, [postId]: '' }));
        } catch (err) { console.error('댓글 작성 실패'); }
    };

    const handleLikeComment = async (commentId) => {
        if (!myId) return Swal.fire('알림', '로그인이 필요합니다.', 'info');
        try {
            await api.post(`/posts/comments/${commentId}/like`);
            fetchPosts();
        } catch (err) { console.error('댓글 좋아요 실패'); }
    };

    const handleUpdateComment = async (commentId, currentContent) => {
        const { value: text } = await Swal.fire({
            title: '댓글 수정',
            input: 'textarea',
            inputValue: currentContent,
            showCancelButton: true,
            confirmButtonColor: '#74c0fc',
        });
        if (text) {
            try {
                await api.put(`/comments/${commentId}`, { content: filterToBubbles(text) });
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
        <PageBackground>
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
                                    <Avatar src={post.author?.profilePic ? getFullImageUrl(post.author.profilePic) : `https://ui-avatars.com/api/?name=${post.author?.nickname}&background=74c0fc&color=fff`} />
                                    <NameCol>
                                        <NameArea>
                                            <UserName>@{post.author?.nickname || 'anonymous'}</UserName>
                                            <BubbleBadge $isAdult={post.author?.isAdult}>
                                                {post.author?.isAdult ? '🐋' : '🐠'}
                                            </BubbleBadge>
                                        </NameArea>
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
                                                // [Fact] 단순 알림창에서 실제 신고 연동 함수로 교체됨
                                                <MenuItem onClick={() => handleReportPost(post.id)}>🚨 신고</MenuItem>
                                            )}
                                        </MenuDropdown>
                                    )}
                                </MenuContainer>
                            </PostHeader>

                            <Content>{post.content}</Content>
                            {post.imageUrl && <PostImg src={getFullImageUrl(post.imageUrl)} />}

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
                                                <AvatarSmall src={comment.author?.profilePic ? getFullImageUrl(comment.author.profilePic) : `https://ui-avatars.com/api/?name=${comment.author?.nickname}&background=74c0fc&color=fff`} />
                                                <CommentBubbleWrapper>
                                                    <CommentBubble>
                                                        <NameArea>
                                                            <CommentUser>@{comment.author?.nickname}</CommentUser>
                                                            <BubbleBadge $isAdult={comment.author?.isAdult} $small>
                                                                {comment.author?.isAdult ? '🐋' : '🐠'}
                                                            </BubbleBadge>
                                                        </NameArea>
                                                        <CommentText>{comment.content}</CommentText>
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
            </Container>

            {isEditModalOpen && (
                <EditPostModal
                    post={editingPost}
                    onClose={() => setIsEditModalOpen(false)}
                    onUpdate={() => { fetchPosts(); setIsEditModalOpen(false); }}
                />
            )}
        </PageBackground>
    );
};

/* --- 스타일 정의 --- */
const PageBackground = styled.div` width: 100%; min-height: 100vh; background-color: #f0f9ff; `;
const Container = styled.div` max-width: 900px; margin: 0 auto; padding: 60px 20px 120px; `;
const TopBar = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; `;
const Header = styled.h1` color: #4dabf7; font-size: 38px; cursor: pointer; letter-spacing: -1px; margin: 0; `;
const NotiBtn = styled.button` background: white; border: none; border-radius: 20px; width: 60px; height: 60px; font-size: 28px; cursor: pointer; box-shadow: 0 8px 20px rgba(165, 216, 255, 0.15); `;
const InputBox = styled.form` background: #fff; padding: 40px; border-radius: 35px; margin-bottom: 50px; box-shadow: 0 15px 40px rgba(165, 216, 255, 0.1); border: 2px solid #d0ebff; `;
const TextArea = styled.textarea` width: 100%; border: none; outline: none; min-height: 120px; font-size: 20px; color: #495057; resize: none; &::placeholder { color: #d0ebff; } `;
const FileRow = styled.div` display: flex; justify-content: space-between; align-items: center; margin-top: 25px; `;
const CameraButton = styled.button` background: #f1f3f5; border:none; padding: 14px 24px; border-radius: 18px; cursor:pointer; font-weight: 700; color: #adb5bd; transition: 0.2s; &:hover { background: #e9ecef; } `;
const SubmitBtn = styled.button` border-radius: 18px; border:none; background:#74c0fc; color:white; padding: 14px 45px; cursor:pointer; font-size: 18px; font-weight: 800; transition: 0.3s; &:hover { background: #4dabf7; } &:disabled { background: #e9ecef; } `;
const PostCard = styled.div` background: #fff; padding: 45px; border-radius: 40px; margin-bottom: 40px; box-shadow: 0 20px 50px rgba(165, 216, 255, 0.08); border: 1px solid #e7f5ff; `;
const PostHeader = styled.div` display: flex; justify-content: space-between; align-items: center; `;
const UserInfo = styled.div` display: flex; align-items: center; gap: 20px; cursor: pointer; `;
const Avatar = styled.img` width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid #f1f3f5; `;
const AvatarSmall = styled.img` width: 35px; height: 35px; border-radius: 50%; object-fit: cover; margin-top: 5px; `;
const NameCol = styled.div` display: flex; flex-direction: column; `;
const NameArea = styled.div` display: flex; align-items: center; gap: 8px; `;
const UserName = styled.span` font-weight: 800; color: #495057; font-size: 18px; `;
const TimeText = styled.span` font-size: 13px; color: #a5d8ff; `;
const Content = styled.p` margin: 30px 0; font-size: 20px; color: #495057; line-height: 1.8; `;
const PostImg = styled.img` width: 100%; border-radius: 30px; margin-bottom: 25px; `;
const ActionRow = styled.div` border-top: 1.5px solid #f8fbff; padding-top: 20px; display: flex; gap: 20px; `;
const LikeBtn = styled.div` display: flex; align-items: center; gap: 8px; cursor: pointer; `;
const Heart = styled.span` font-size: 30px; color: ${props => props.$isLiked ? '#ff8787' : '#dee2e6'}; transition: 0.2s; `;
const LikeCount = styled.span` font-size: 18px; font-weight: 800; color: ${props => props.$isLiked ? '#ff8787' : '#adb5bd'}; `;
const CommentSection = styled.div` margin-top: 30px; background: #f8fbff; padding: 30px; border-radius: 30px; border: 1px solid #e7f5ff; `;
const CommentItem = styled.div` margin-bottom: 20px; `;
const CommentContent = styled.div` display: flex; gap: 12px; `;
const CommentBubbleWrapper = styled.div` flex: 1; display: flex; flex-direction: column; gap: 5px; `;
const CommentBubble = styled.div` background: #fff; padding: 12px 18px; border-radius: 0 20px 20px 20px; box-shadow: 0 2px 10px rgba(165, 216, 255, 0.05); `;
const CommentUser = styled.b` color: #74c0fc; font-size: 14px; margin-bottom: 2px; `;
const CommentText = styled.span` color: #495057; font-size: 15px; line-height: 1.4; `;
const CommentActionRow = styled.div` display: flex; gap: 15px; padding-left: 5px; `;
const CommentActionItem = styled.span` font-size: 13px; color: ${props => props.$active ? '#ff8787' : '#adb5bd'}; cursor: pointer; font-weight: bold; `;
const BubbleBadge = styled.div`
    display: flex; justify-content: center; align-items: center;
    width: ${p => p.$small ? '22px' : '26px'};
    height: ${p => p.$small ? '22px' : '26px'};
    font-size: ${p => p.$small ? '11px' : '13px'};
    background: white;
    border: 2px solid ${props => props.$isAdult ? '#74c0fc' : '#63e6be'};
    border-radius: 60% 40% 70% 30% / 40% 50% 60% 50%;
    animation: ${bubbleShake} 4s ease-in-out infinite;
    flex-shrink: 0;
    box-shadow: 0 2px 5px rgba(0,0,0,0.02);
`;
const CommentInputRow = styled.div` display: flex; gap: 15px; margin-top: 25px; `;
const CommentInput = styled.input` flex: 1; border: 2px solid #e7f5ff; border-radius: 18px; padding: 15px 20px; font-size: 16px; outline: none; transition: 0.2s; &:focus { border-color: #74c0fc; } `;
const CommentBtn = styled.button` background: #74c0fc; color: white; border: none; border-radius: 18px; padding: 0 30px; font-size: 16px; font-weight: 800; cursor:pointer; &:hover { background: #4dabf7; } `;
const MenuContainer = styled.div` position: relative; `;
const MenuBtn = styled.button` background: none; border: none; font-size: 30px; cursor: pointer; color: #d0ebff; `;
const MenuDropdown = styled.div` position: absolute; right: 0; top: 40px; background: white; border-radius: 15px; box-shadow: 0 10px 30px rgba(165, 216, 255, 0.15); z-index: 100; width: 130px; overflow: hidden; `;
const MenuItem = styled.div` padding: 15px; font-size: 15px; cursor: pointer; text-align: center; color: #495057; &:hover { background: #f8fbff; color: #74c0fc; } &.delete { color: #ff8787; } `;
const PreviewWrapper = styled.div` position: relative; margin: 20px 0; `;
const Preview = styled.img` width: 250px; border-radius: 25px; box-shadow: 0 10px 20px rgba(165, 216, 255, 0.1); `;
const RemovePreview = styled.button` position: absolute; top:-10px; left: 235px; background: #ff8787; color:white; border:none; border-radius:50%; width:30px; height:30px; cursor:pointer; font-weight: bold; `;

export default FeedPage;