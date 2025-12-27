import { useState } from 'react';

export default function EditPostModal({ post, onClose, onUpdate }) {
    const [content, setContent] = useState(post.content);
    const [image, setImage] = useState(null);

    const handleSubmit = async () => {
        const formData = new FormData();
        formData.append('content', content);
        if (image) formData.append('image', image);

        const res = await fetch(`/posts/${post.id}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: formData,
        });

        const updatedPost = await res.json();
        onUpdate(updatedPost);   // 🔥 상태 즉시 반영
        onClose();
    };

    return (
        <div className="modal">
            <h3>게시글 수정</h3>
            <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
            />
            <input type="file" onChange={e => setImage(e.target.files[0])} />

            <button onClick={handleSubmit}>저장</button>
            <button onClick={onClose}>취소</button>
        </div>
    );
}
