import React, { useState } from 'react';
import styled from 'styled-components';
import api from '../api/api';
import Swal from 'sweetalert2';

const PostModal = ({ onClose, onSuccess }) => {
    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState('');

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() && !image) return;

        const formData = new FormData();
        formData.append('content', content);
        if (image) formData.append('image', image);

        try {
            // 1. 서버에 데이터 전송 및 응답 대기
            await api.post('/posts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // 2. [핵심] 부모의 fetchPosts가 끝날 때까지 기다림
            // 이렇게 해야 리액트 상태(posts)가 먼저 업데이트된 후 화면이 바뀝니다.
            if (onSuccess) {
                await onSuccess();
            }

            // 3. 데이터가 화면에 반영된 것을 확인한 후 모달 닫기
            onClose();

            // 4. 성공 알림창 표시
            Swal.fire({
                title: '성공',
                text: '게시글이 등록되었습니다! 🫧',
                icon: 'success',
                confirmButtonColor: '#74b9ff',
                timer: 1500
            });

        } catch (err) {
            console.error(err);
            Swal.fire('실패', '게시물 작성에 실패했습니다.', 'error');
        }
    };

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <Header>
                    <div style={{ width: '24px' }} />
                    <ModalTitle>새 게시물 만들기</ModalTitle>
                    <CloseBtn onClick={onClose}>&times;</CloseBtn>
                </Header>

                <form onSubmit={handleSubmit}>
                    <MainBody>
                        <ImageSection $hasPreview={!!preview}>
                            {!preview ? (
                                <UploadLabel htmlFor="file-upload">
                                    <div className="icon">📸</div>
                                    <div>사진을 선택하세요</div>
                                </UploadLabel>
                            ) : (
                                <PreviewWrapper>
                                    <PreviewImage src={preview} alt="미리보기" />
                                    <ChangeImageLabel htmlFor="file-upload">사진 변경</ChangeImageLabel>
                                </PreviewWrapper>
                            )}
                            <input
                                id="file-upload"
                                type="file"
                                onChange={handleImageChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                        </ImageSection>

                        <TextSection>
                            <TextArea
                                placeholder="나누고 싶은 이야기를 적어보세요..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                            />
                            <SubmitBtn type="submit" disabled={!content.trim() && !image}>
                                공유하기
                            </SubmitBtn>
                        </TextSection>
                    </MainBody>
                </form>
            </ModalContent>
        </ModalOverlay>
    );
};

/* ===== Styles (기존과 동일) ===== */
const ModalOverlay = styled.div` position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center; z-index: 3000; `;
const ModalContent = styled.div` background: white; border-radius: 12px; width: 90%; max-width: 800px; min-height: 400px; position: relative; box-shadow: 0 10px 40px rgba(0,0,0,0.3); overflow: hidden; `;
const Header = styled.div` display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; border-bottom: 1px solid #efefef; `;
const ModalTitle = styled.h4` margin: 0; font-size: 16px; font-weight: 600; `;
const CloseBtn = styled.button` background: none; border: none; font-size: 28px; cursor: pointer; color: #333; `;
const MainBody = styled.div` display: flex; height: 500px; @media (max-width: 768px) { flex-direction: column; height: auto; } `;
const ImageSection = styled.div` flex: 1.2; background: ${props => props.$hasPreview ? '#000' : '#fafafa'}; display: flex; align-items: center; justify-content: center; border-right: 1px solid #efefef; `;
const UploadLabel = styled.label` text-align: center; cursor: pointer; .icon { font-size: 50px; margin-bottom: 10px; } color: #8e8e8e; font-weight: 500; `;
const PreviewWrapper = styled.div` position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; `;
const PreviewImage = styled.img` max-width: 100%; max-height: 100%; object-fit: contain; `;
const ChangeImageLabel = styled.label` position: absolute; bottom: 15px; right: 15px; background: rgba(0,0,0,0.7); color: white; padding: 8px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; `;
const TextSection = styled.div` flex: 0.8; padding: 20px; display: flex; flex-direction: column; `;
const TextArea = styled.textarea` width: 100%; flex: 1; border: none; font-size: 16px; resize: none; outline: none; line-height: 1.6; `;
const SubmitBtn = styled.button` width: 100%; background: #74b9ff; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 15px; transition: 0.2s; &:hover { background: #0984e3; } &:disabled { background: #dfe6e9; cursor: default; } `;

export default PostModal;