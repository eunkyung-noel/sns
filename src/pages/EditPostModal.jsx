import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import Swal from 'sweetalert2';

export default function EditPostModal({ post, onClose, onUpdate }) {
    const [content, setContent] = useState(post.content);
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(post.imageUrl ? (post.imageUrl.startsWith('http') ? post.imageUrl : `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}${post.imageUrl}`) : null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!content.trim()) return Swal.fire('알림', '내용을 입력해주세요.', 'warning');
        setLoading(true);

        const formData = new FormData();
        formData.append('content', content);
        if (image) formData.append('image', image);

        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/posts/${post.id}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: formData,
            });

            if (!res.ok) throw new Error('수정 실패');
            const updatedPost = await res.json();

            // 🫧 팝업 먼저 띄우고 대기
            await Swal.fire({
                title: '수정 완료! 🫧',
                text: '성공적으로 변경되었습니다.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                background: '#ffffff',
                backdrop: `rgba(116, 185, 255, 0.2) blur(5px)`
            });

            onClose(); // 팝업 완료 후 창 닫기
            if (onUpdate) onUpdate(updatedPost);
        } catch (err) {
            console.error(err);
            Swal.fire('에러', '수정 중 오류 발생', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SweetOverlay onClick={onClose}>
            <SweetContainer onClick={e => e.stopPropagation()}>
                <SweetHeader>
                    <div style={{ width: 24 }} />
                    <SweetTitle>게시글 수정 🫧</SweetTitle>
                    <SweetCloseBtn onClick={onClose}>&times;</SweetCloseBtn>
                </SweetHeader>

                <SweetScrollBody>
                    <SweetEditorSection>
                        <SweetTextArea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="기록하고 싶은 순간을 다듬어보세요... 🫧"
                        />
                        {preview && (
                            <SweetPreviewWrapper>
                                <img src={preview} alt="preview" />
                                <SweetImageLabel htmlFor="final-bubble-input">🫧 교체</SweetImageLabel>
                            </SweetPreviewWrapper>
                        )}
                        <input id="final-bubble-input" type="file" hidden onChange={handleFileChange} accept="image/*" />
                    </SweetEditorSection>
                </SweetScrollBody>

                <SweetFooter>
                    <SweetSaveButton onClick={handleSubmit} disabled={loading}>
                        {loading ? '저장 중...' : '변경사항 저장'}
                    </SweetSaveButton>
                </SweetFooter>
            </SweetContainer>
        </SweetOverlay>
    );
}

/* --- 🫧 절대 안 겹치는 비눗방울 스타일 시스템 🫧 --- */

const sweetPop = keyframes`
    0% { opacity: 0; transform: scale(0.9) translateY(40px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
`;

const SweetOverlay = styled.div`
    position: fixed; inset: 0;
    background: rgba(116, 185, 255, 0.1);
    backdrop-filter: blur(15px);
    display: flex; justify-content: center; align-items: center;
    z-index: 10005; /* 숫자를 높여서 무조건 맨 위로 */
`;

const SweetContainer = styled.div`
    background: rgba(255, 255, 255, 0.9);
    width: 90%; max-width: 480px;
    max-height: 85vh; /* 🔍 화면 높이 100vh에 최적화 */
    border-radius: 50px;
    display: flex; flex-direction: column;
    box-shadow: 0 40px 80px rgba(116, 185, 255, 0.2);
    animation: ${sweetPop} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    border: 1px solid rgba(255, 255, 255, 0.5);
    overflow: hidden;
`;

const SweetHeader = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    padding: 30px 40px 10px; flex-shrink: 0;
`;

const SweetTitle = styled.h3`
    margin: 0; color: #74b9ff; font-size: 22px; font-weight: 900;
`;

const SweetCloseBtn = styled.button`
    background: #f0f7ff; border: none; font-size: 22px; color: #74b9ff;
    width: 40px; height: 40px; border-radius: 50%; cursor: pointer;
    &:hover { background: #ff7675; color: white; }
`;

const SweetScrollBody = styled.div`
    padding: 20px 40px;
    overflow-y: auto; flex: 1;
    &::-webkit-scrollbar { width: 5px; }
    &::-webkit-scrollbar-thumb { background: #d1e9ff; border-radius: 10px; }
`;

const SweetEditorSection = styled.div` display: flex; flex-direction: column; gap: 20px; `;

const SweetTextArea = styled.textarea`
    width: 100%; min-height: 180px; border: none; outline: none;
    font-size: 16px; line-height: 1.6; resize: none; color: #2d3436;
    background: rgba(116, 185, 255, 0.05); padding: 25px; border-radius: 35px;
`;

const SweetPreviewWrapper = styled.div`
    position: relative; width: 100%; border-radius: 35px; overflow: hidden;
    border: 6px solid white;
    img { width: 100%; max-height: 250px; object-fit: cover; display: block; }
`;

const SweetImageLabel = styled.label`
    position: absolute; top: 15px; right: 15px;
    background: rgba(116, 185, 255, 0.9); color: white;
    padding: 8px 16px; border-radius: 20px; font-size: 11px; font-weight: 800;
    cursor: pointer;
`;

const SweetFooter = styled.div` padding: 20px 40px 40px; flex-shrink: 0; `;

const SweetSaveButton = styled.button`
    width: 100%; background: linear-gradient(135deg, #a2d2ff 0%, #74b9ff 100%);
    color: white; border: none; padding: 20px; border-radius: 35px;
    font-size: 17px; font-weight: 900; cursor: pointer;
    box-shadow: 0 15px 30px rgba(116, 185, 255, 0.4);
    transition: 0.3s;
    &:hover { transform: translateY(-3px); }
    &:disabled { background: #dfe6e9; box-shadow: none; }
`;