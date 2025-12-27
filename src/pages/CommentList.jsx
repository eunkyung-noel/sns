export default function CommentList({ comments, postId, setPosts }) {
    const userId = localStorage.getItem('userId');

    const deleteComment = async (commentId) => {
        await fetch(`/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        });

        setPosts(prev =>
            prev.map(p =>
                p.id === postId
                    ? { ...p, comments: p.comments.filter(c => c.id !== commentId) }
                    : p
            )
        );
    };

    return (
        <div>
            {comments.map(c => (
                <div key={c.id}>
                    <b>{c.author.nickname}</b> {c.content}
                    {c.author.id === userId && (
                        <button onClick={() => deleteComment(c.id)}>삭제</button>
                    )}
                </div>
            ))}
        </div>
    );
}
