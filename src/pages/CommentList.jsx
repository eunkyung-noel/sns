import React from 'react';
import styled from 'styled-components';

export default function CommentList({ comments, postId, setPosts }) {
    const userId = localStorage.getItem('userId');

    const deleteComment = async (commentId) => {
        // 기존 삭제 로직 유지
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
        <CommentContainer>
            {comments.map(c => (
                <CommentItem key={c.id}>
                    <CommentContent>
                        <Author>{c.author.nickname}</Author>
                        <Text>{c.content}</Text>
                    </CommentContent>

                    {String(c.author.id) === String(userId) && (
                        <DeleteButton onClick={() => deleteComment(c.id)}>
                            삭제
                        </DeleteButton>
                    )}
                </CommentItem>
            ))}
        </CommentContainer>
    );
}

/* --- 스타일: 기존 구조를 유지하며 웹 규격으로 사이즈 확장 --- */

const CommentContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;           /* 🔍 댓글 간 간격 확대 */
    padding: 20px 0;     /* 🔍 상하 여백 추가 */
    width: 100%;
`;

const CommentItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 15px;  /* 🔍 댓글 내부 패딩 확대 */
    background: #f8f9fa; /* 🔍 약간의 배경색으로 영역 구분 */
    border-radius: 10px;
    transition: background 0.2s;

    &:hover {
        background: #f1f2f6;
    }
`;

const CommentContent = styled.div`
    display: flex;
    align-items: center;
    gap: 15px;           /* 🔍 닉네임과 내용 사이 간격 확대 */
    font-size: 15px;     /* 🔍 웹 표준 폰트 사이즈로 확대 */
`;

const Author = styled.b`
    color: #333;
    min-width: fit-content;
`;

const Text = styled.span`
    color: #555;
    line-height: 1.5;
`;

const DeleteButton = styled.button`
    background: none;
    border: none;
    color: #ff7675;      /* 삭제 버튼 색상 강조 */
    font-size: 13px;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 5px;
    transition: all 0.2s;

    &:hover {
        background: rgba(255, 118, 117, 0.1);
        text-decoration: underline;
    }
`;