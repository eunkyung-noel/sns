import { useState } from 'react';
import api from '../api';

const PostItem = ({ post, refreshPosts }) => {
    const [commentText, setCommentText] = useState('');

    const handleCommentSubmit = async () => {
        if (!commentText.trim()) return;

        try {
            await api.post(`/posts/${post._id}/comment`, {
                content: commentText
            });

            setCommentText('');
            refreshPosts(); // 댓글 포함 게시글 다시 불러오기
        } catch (err) {
            alert('댓글 작성 실패');
        }
    };

    return (
        <div className="post-card">
            <p>{post.content}</p>

            {/* 💬 댓글 목록 */}
            <div className="comments">
                {post.comments?.map(comment => (
                    <div key={comment._id} className="comment-bubble">
                        {comment.content}
                    </div>
                ))}
            </div>

            {/* ✏️ 댓글 작성 */}
            <div className="comment-input">
                <input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="댓글을 입력하세요"
                />
                <button onClick={handleCommentSubmit}>등록</button>
            </div>
        </div>
    );
};

export default PostItem;
