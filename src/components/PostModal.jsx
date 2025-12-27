import React, { useState } from 'react';
import styled from 'styled-components';
import api from '../api/api';
import Swal from 'sweetalert2';

const PostModal = ({ onClose }) => {
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

        // FormData를 사용하여 텍스트와 이미지 전송
        const formData = new FormData();
        formData.append('content', content);
        if (image) formData.append('image', image);

        try {
            await api.post('/posts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await Swal.fire('성공', '게시글이 등록되었습니다! 🫧', 'success');
            onClose(); // 모달 닫기
            window.location.reload(); // 피드 새로고침
        } catch (err) {
            console.error(err);
            Swal.fire('실패', '게시물 작성에 실패했습니다.', 'error');
        }
    };

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <CloseBtn onClick={onClose}>&times;</CloseBtn>
                <ModalTitle>새 게시물 만들기 🫧</ModalTitle>

                <form onSubmit={handleSubmit}>
                    <TextArea
                        placeholder="나누고 싶은 이야기를 적어보세요..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                    />

                    <UploadSection>
                        <label htmlFor="file-upload">📸 사진 추가하기</label>
                        <input
                            id="file-upload"
                            type="file"
                            onChange={handleImageChange}
                            accept="image/*"
                        />
                    </UploadSection>

                    {preview && <PreviewImage src={preview} alt="미리보기" />}

                    <SubmitBtn type="submit">공유하기</SubmitBtn>
                </form>
            </ModalContent>
        </ModalOverlay>
    );
};

export default PostModal;

/* ===== Styles ===== */
const ModalOverlay = styled.div`
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.6); display: flex;
    justify-content: center; align-items: center; z-index: 3000;
`;

const ModalContent = styled.div`
    background: white; padding: 25px; border-radius: 20px;
    width: 90%; max-width: 450px; position: relative;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
`;

const ModalTitle = styled.h3` text-align: center; color: #333; margin-bottom: 20px; `;

const CloseBtn = styled.button`
    position: absolute; top: 15px; right: 15px; background: none;
    border: none; font-size: 24px; cursor: pointer; color: #999;
`;

const TextArea = styled.textarea`
    width: 100%; height: 120px; border: 1px solid #eee; border-radius: 10px;
    padding: 12px; font-size: 16px; resize: none; outline: none;
    &:focus { border-color: #74b9ff; }
`;

const UploadSection = styled.div`
    margin: 15px 0; text-align: center;
    label { background: #f0faff; color: #74b9ff; padding: 8px 15px; border-radius: 20px; font-weight: bold; cursor: pointer; }
    input { display: none; }
`;

const PreviewImage = styled.img` width: 100%; border-radius: 10px; margin-bottom: 15px; max-height: 250px; object-fit: cover; `;

const SubmitBtn = styled.button`
    width: 100%; background: #74b9ff; color: white; border: none;
    padding: 15px; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 16px;
    &:hover { background: #0984e3; }
`;