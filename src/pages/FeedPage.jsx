import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import api from '../api/api';
import Swal from 'sweetalert2';

// 🔍 비속어 체크 목록 (백엔드와 동일하게 유지)
const badWords = [
    'ㅅㅂ', '시발', '씨발', '병신', 'ㅄ', 'ㅂㅅ', '새끼', 'ㄲㅏ', '존나', '졸라',
    '개새끼', '미친', '지랄', '엠창', '엄창', '느금', '니기미', '씨부레', '씨부랄', '씌발',
    'tq', 'ㅅㅐㄲㅣ', 'ㅈㄴ', 'ㅆㅂ', '凸', '뻐큐', '등신', '멍청이', '쓰레기', '호로',
    '쌍놈', '썅', '샹놈', '씹', '잡놈', '변태', '띨띨', '닥쳐', '아가리', '주둥이',
    '미친개', '미친놈', '미친년', '걸레', '창녀', '화냥년', '씨팔', '지랄마', '염병', '옘병',
    '뒤져', '뒈져', '꺼져', '빡대가리', '대가리', '뇌가리', '호구', '찐따', '일베', '메갈',
    'tqsusdk', 'tqtoRl'
];

const FeedPage = () => {
    const [posts, setPosts] = useState([]);
    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState('');
    const [commentInputs, setCommentInputs] = useState({});

    const SERVER_URL = 'http://localhost:5001';

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const myId = String(storedUser.id || localStorage.getItem('userId') || '');

    const fetchPosts = async () => {
        try {
            const res = await api.get('/posts');
            setPosts(res.data || []);
        } catch (err) { console.error('피드 로딩 실패:', err); }
    };

    useEffect(() => { fetchPosts(); }, []);

    // 1. 게시글 작성 (비속어 팝업 추가)
    const handlePostSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() && !image) return;

        // 비속어 검사
        const hasBadWord = badWords.some(word => content.includes(word));
        if (hasBadWord) {
            const result = await Swal.fire({
                title: '부적절한 언어 감지',
                html: `부적절한 언어가 포함되어 있습니다.<br>해당 단어는 <b>🫧🫧🫧🫧</b>로 표시됩니다.<br><br>정말로 게시하시겠습니까?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: '네, 게시합니다',
                cancelButtonText: '취소',
                confirmButtonColor: '#74b9ff'
            });
            if (!result.isConfirmed) return;
        }

        const formData = new FormData();
        formData.append('content', content);
        if (image) formData.append('image', image);

        try {
            await api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setContent(''); setImage(null); setPreview('');
            fetchPosts();
        } catch (err) { Swal.fire('에러', '작성 실패', 'error'); }
    };

    // 2. 게시글 수정
    const handleEditPost = async (postId, oldContent) => {
        const { value: newContent } = await Swal.fire({
            title: '게시글 수정',
            input: 'textarea',
            inputValue: oldContent,
            showCancelButton: true,
            confirmButtonText: '수정',
            cancelButtonText: '취소'
        });
        if (newContent) {
            try {
                await api.put(`/posts/${postId}`, { content: newContent });
                fetchPosts();
            } catch (err) { Swal.fire('실패', '수정 권한이 없습니다.', 'error'); }
        }
    };

    // 3. 게시글 삭제
    const handleDeletePost = async (postId) => {
        const r = await Swal.fire({ title: '게시글을 삭제할까요?', icon: 'warning', showCancelButton: true });
        if (r.isConfirmed) {
            try {
                await api.delete(`/posts/${postId}`);
                setPosts(prev => prev.filter(p => p._id !== postId));
            } catch (err) { Swal.fire('실패', '권한이 없습니다.', 'error'); }
        }
    };

    // 4. 게시글 좋아요
    const handleLike = async (postId) => {
        try {
            const res = await api.post(`/posts/${postId}/like`);
            setPosts(prev => prev.map(p => p._id === postId ? { ...p, likes: res.data.likes } : p));
        } catch (err) { console.error('좋아요 실패'); }
    };

    // 5. 댓글 작성 (비속어 팝업 추가)
    const handleCommentSubmit = async (postId) => {
        const text = commentInputs[postId];
        if (!text?.trim()) return;

        // 비속어 검사
        const hasBadWord = badWords.some(word => text.includes(word));
        if (hasBadWord) {
            const result = await Swal.fire({
                title: '부적절한 언어 감지',
                html: `댓글에 부적절한 언어가 포함되어 있습니다.<br>해당 단어는 <b>🫧🫧🫧🫧</b>로 표시됩니다.<br><br>등록하시겠습니까?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: '네, 등록합니다',
                cancelButtonText: '취소',
                confirmButtonColor: '#74b9ff'
            });
            if (!result.isConfirmed) return;
        }

        try {
            await api.post(`/posts/${postId}/comment`, { content: text });
            setCommentInputs(prev => ({ ...prev, [postId]: '' }));
            fetchPosts();
        } catch (err) { console.error('댓글 실패'); }
    };

    // 6. 댓글 수정
    const handleEditComment = async (postId, commentId, oldContent) => {
        const { value: newContent } = await Swal.fire({
            title: '댓글 수정',
            input: 'text',
            inputValue: oldContent,
            showCancelButton: true,
            confirmButtonText: '수정',
            cancelButtonText: '취소'
        });
        if (newContent) {
            try {
                await api.put(`/posts/${postId}/comment/${commentId}`, { content: newContent });
                fetchPosts();
            } catch (err) { Swal.fire('실패', '수정 권한이 없습니다.', 'error'); }
        }
    };

    // 7. 댓글 삭제
    const handleDeleteComment = async (postId, commentId) => {
        const r = await Swal.fire({ title: '댓글을 삭제할까요?', icon: 'question', showCancelButton: true });
        if (r.isConfirmed) {
            try {
                await api.delete(`/posts/${postId}/comment/${commentId}`);
                fetchPosts();
            } catch (err) { Swal.fire('실패', '삭제 실패', 'error'); }
        }
    };

    // 8. 댓글 좋아요
    const handleCommentLike = async (postId, commentId) => {
        try {
            const res = await api.post(`/posts/${postId}/comment/${commentId}/like`);
            setPosts(prev => prev.map(post => {
                if (post._id === postId) {
                    return {
                        ...post,
                        comments: post.comments.map(c =>
                            c._id === commentId ? { ...c, likes: res.data.likes } : c
                        )
                    };
                }
                return post;
            }));
        } catch (err) { console.error('댓글 좋아요 실패'); }
    };

    return (
        <Container>
            <Header>🫧 Bubble Feed</Header>
            <InputBox onSubmit={handlePostSubmit}>
                <TextArea value={content} onChange={e => setContent(e.target.value)} placeholder="무슨 생각을 하고 계신가요?" />
                <FileRow>
                    <input type="file" accept="image/*" onChange={e => {
                        const file = e.target.files[0];
                        if (file) { setImage(file); setPreview(URL.createObjectURL(file)); }
                    }} />
                    <SubmitBtn type="submit">게시</SubmitBtn>
                </FileRow>
                {preview && <Preview src={preview} />}
            </InputBox>

            {posts.map(post => (
                <PostCard key={post._id}>
                    <PostHeader>
                        <UserName>@{post.author?.username || 'user'}</UserName>
                        <ActionBtns>
                            {String(post.author?._id || post.author) === myId && (
                                <>
                                    <IconBtn onClick={() => handleEditPost(post._id, post.content)}>✏️</IconBtn>
                                    <IconBtn onClick={() => handleDeletePost(post._id)}>🗑️</IconBtn>
                                </>
                            )}
                        </ActionBtns>
                    </PostHeader>
                    <Content>{post.content}</Content>
                    {post.imageUrl && <PostImg src={`${SERVER_URL}${post.imageUrl}`} />}

                    <LikeSection onClick={() => handleLike(post._id)}>
                        <Heart active={post.likes?.includes(myId)}>
                            {post.likes?.includes(myId) ? '❤️' : '🤍'}
                        </Heart>
                        <LikeCount>{post.likes?.length || 0}</LikeCount>
                    </LikeSection>

                    <CommentList>
                        {post.comments?.map(c => (
                            <CommentItem key={c._id}>
                                <div style={{ flex: 1 }}>
                                    <CommentText>
                                        <b>{c.author?.username || 'user'}:</b> {c.content}
                                    </CommentText>
                                    <CommentActionRow>
                                        <CommentLikeBtn onClick={() => handleCommentLike(post._id, c._id)}>
                                            {c.likes?.includes(myId) ? '❤️' : '🤍'} {c.likes?.length || 0}
                                        </CommentLikeBtn>
                                        {String(c.author?._id || c.author) === myId && (
                                            <>
                                                <IconBtn style={{fontSize:'12px'}} onClick={() => handleEditComment(post._id, c._id, c.content)}>✏️</IconBtn>
                                                <IconBtn style={{fontSize:'12px'}} onClick={() => handleDeleteComment(post._id, c._id)}>🗑️</IconBtn>
                                            </>
                                        )}
                                    </CommentActionRow>
                                </div>
                            </CommentItem>
                        ))}
                    </CommentList>

                    <CommentBox>
                        <CommentInput
                            value={commentInputs[post._id] || ''}
                            onChange={e => setCommentInputs(prev => ({ ...prev, [post._id]: e.target.value }))}
                            placeholder="댓글 달기..."
                        />
                        <CommentBtn onClick={() => handleCommentSubmit(post._id)}>등록</CommentBtn>
                    </CommentBox>
                </PostCard>
            ))}
        </Container>
    );
};

export default FeedPage;

/* 스타일 섹션 (생략 없이 유지) */
const Container = styled.div` max-width: 500px; margin: auto; padding: 20px; font-family: 'Pretendard', sans-serif; `;
const Header = styled.h1` color: #74b9ff; text-align: center; margin-bottom: 30px; `;
const InputBox = styled.form` background: #fff; padding: 15px; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-bottom: 25px; `;
const TextArea = styled.textarea` width: 100%; border: none; outline: none; resize: none; min-height: 80px; font-size: 15px; `;
const FileRow = styled.div` display: flex; justify-content: space-between; align-items: center; margin-top: 10px; `;
const SubmitBtn = styled.button` background: #74b9ff; color: white; border: none; padding: 7px 20px; border-radius: 15px; cursor: pointer; font-weight: bold; `;
const Preview = styled.img` width: 100%; border-radius: 15px; margin-top: 10px; `;
const PostCard = styled.div` background: #fff; padding: 20px; border-radius: 25px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); `;
const PostHeader = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; `;
const UserName = styled.span` font-weight: 800; color: #0984e3; font-size: 14px; `;
const ActionBtns = styled.div` display: flex; gap: 10px; `;
const IconBtn = styled.button` background: none; border: none; cursor: pointer; font-size: 16px; transition: transform 0.1s; &:active { transform: scale(0.9); } `;
const Content = styled.p` margin-bottom: 15px; line-height: 1.5; color: #2d3436; `;
const PostImg = styled.img` width: 100%; border-radius: 15px; margin-bottom: 12px; `;
const LikeSection = styled.div` display: flex; align-items: center; gap: 5px; cursor: pointer; user-select: none; `;
const Heart = styled.span` font-size: 18px; `;
const LikeCount = styled.span` font-weight: bold; color: #636e72; `;
const CommentList = styled.div` margin-top: 18px; border-top: 1px solid #f1f2f6; padding-top: 12px; `;
const CommentItem = styled.div` display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; `;
const CommentText = styled.div` font-size: 13.5px; color: #2d3436; line-height: 1.4; margin-bottom: 4px; `;
const CommentActionRow = styled.div` display: flex; align-items: center; gap: 12px; `;
const CommentLikeBtn = styled.button` background: none; border: none; cursor: pointer; font-size: 12px; color: #636e72; padding: 0; display: flex; align-items: center; gap: 3px; `;
const CommentBox = styled.div` display: flex; gap: 8px; margin-top: 15px; `;
const CommentInput = styled.input` flex: 1; border-radius: 12px; border: 1px solid #dfe6e9; padding: 8px 12px; outline: none; font-size: 13px; &:focus { border-color: #74b9ff; } `;
const CommentBtn = styled.button` background: #74b9ff; color: white; border: none; border-radius: 12px; padding: 0 15px; cursor: pointer; font-size: 13px; font-weight: bold; `;