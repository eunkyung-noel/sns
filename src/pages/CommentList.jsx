import React from 'react';
import styled from 'styled-components';
import Swal from 'sweetalert2';

export default function CommentList({ comments, postId, setPosts }) {
    const userId = localStorage.getItem('userId');

    // 1. 알림 디자인 통합 (이쁘게 처리)
    const showToast = (title, icon, color) => {
        Swal.fire({
            title: `<span style="color: ${color}; font-weight: 800;">${title}</span>`,
            icon: icon,
            position: 'top',
            showConfirmButton: false,
            timer: 1200,
            width: '320px',
            background: '#ffffff',
            borderRadius: '20px',
            backdrop: `rgba(0, 0, 0, 0.05) blur(2px)`
        });
    };

    const deleteComment = async (commentId) => {
        try {
            const res = await fetch(`/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (res.ok) {
                setPosts(prev =>
                    prev.map(p =>
                        p.id === postId
                            ? { ...p, comments: p.comments.filter(c => c.id !== commentId) }
                            : p
                    )
                );
                showToast('삭제 완료 🗑️', 'success', '#ff7675');
            }
        } catch (err) {
            showToast('삭제 실패', 'error', '#d63031');
        }
    };

    const handleEdit = (comment) => {
        // 수정 로직 (필요 시 구현)
        showToast('수정 모드 ✏️', 'info', '#74b9ff');
    };

    return (
        <CommentContainer>
            {comments.map(c => (
                <CommentItem key={c.id}>
                    <CommentContent>
                        <Author>{c.author.nickname}</Author>
                        <Text>{c.content}</Text>
                    </CommentContent>

                    {/* [교정] 본인 확인 후 이모지 버튼 출력 */}
                    {String(c.author?.id) === String(userId) && (
                        <ActionGroup>
                            <IconButton onClick={() => handleEdit(c)} title="수정">
                                ✏️
                            </IconButton>
                            <IconButton onClick={() => deleteComment(c.id)} title="삭제" $isDelete>
                                🗑️
                            </IconButton>
                        </ActionGroup>
                    )}
                </CommentItem>
            ))}
        </CommentContainer>
    );
}

/* --- 스타일 정의 --- */

const CommentContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 15px 0;
    width: 100%;
`;

const CommentItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 18px;
    background: #ffffff;
    border: 1px solid #f1f2f6;
    border-radius: 15px;
    transition: all 0.2s ease;

    &:hover {
        border-color: #74b9ff;
        box-shadow: 0 4px 12px rgba(116, 185, 255, 0.08);
    }
`;

const CommentContent = styled.div`
    display: flex;
    flex-direction: column; /* 🔍 닉네임과 내용을 위아래로 배치 (웹 가독성) */
    gap: 2px;
`;

const Author = styled.span`
    font-size: 13px;
    font-weight: 800;
    color: #2d3436;
`;

const Text = styled.span`
    font-size: 15px;
    color: #636e72;
    line-height: 1.4;
`;

const ActionGroup = styled.div`
    display: flex;
    gap: 8px;
`;

const IconButton = styled.button`
    background: none;
    border: none;
    font-size: 18px; /* 🔍 이모지 크기 확보 */
    cursor: pointer;
    padding: 5px;
    border-radius: 8px;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        background: ${props => props.$isDelete ? 'rgba(255, 118, 117, 0.1)' : 'rgba(116, 185, 255, 0.1)'};
        transform: scale(1.1);
    }
`;