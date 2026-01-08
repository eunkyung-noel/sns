import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../api/api';
import Swal from 'sweetalert2';

const PostCreatePage = () => {
    const navigate = useNavigate();
    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    // 이미지 선택 핸들러
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire('오류', '로그인 토큰이 없습니다. 다시 로그인하세요.', 'error');
            return navigate('/login');
        }

        if (!content.trim()) return Swal.fire('알림', '내용을 입력해주세요.', 'warning');

        setLoading(true);
        const formData = new FormData();
        formData.append('content', content);
        if (image) {
            formData.append('image', image);
            // 필요 시 검열 필드 추가 가능
            formData.append('isSafe', 'true');
        }

        try {
            await api.post('/posts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            Swal.fire({ icon: 'success', title: '버블 발사 성공!', timer: 1500, showConfirmButton: false });
            navigate('/feed');
        } catch (err) {
            const status = err.response?.status;
            const serverMsg = err.response?.data?.message || "서버 응답 없음";

            if (status === 401) {
                Swal.fire('인증 만료', '다시 로그인 해주세요.', 'error');
                navigate('/login');
            } else {
                Swal.fire({
                    icon: 'error',
                    title: '업로드 실패',
                    html: `에러 코드: <b>${status}</b><br/>원인: ${serverMsg}`
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <Header>
                <BackBtn onClick={() => navigate(-1)}>〈</BackBtn>
                <TitleCol>
                    <Title>새 게시물 작성</Title>
                    <SubTitle>당신의 일상을 버블에 담아 발사해보세요. 🫧</SubTitle>
                </TitleCol>
            </Header>

            <FormBox onSubmit={handleSubmit}>
                <EditorSection>
                    <TextArea
                        placeholder="지금 무슨 생각을 하고 계신가요?"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />

                    {preview && (
                        <PreviewWrapper>
                            <img src={preview} alt="preview" />
                            <RemoveBtn onClick={() => { setImage(null); setPreview(''); }}>✕</RemoveBtn>
                        </PreviewWrapper>
                    )}
                </EditorSection>

                <ActionToolbar>
                    <MediaBtn type="button" onClick={() => fileInputRef.current.click()}>
                        📷 사진 추가
                    </MediaBtn>
                    <input
                        type="file"
                        ref={fileInputRef}
                        hidden
                        accept="image/*"
                        onChange={handleImageChange}
                    />

                    <SubmitBtn type="submit" disabled={loading || !content.trim()}>
                        {loading ? '발사 중...' : '버블 발사'}
                    </SubmitBtn>
                </ActionToolbar>
            </FormBox>
        </Container>
    );
};

/* --- 스타일 정의: 와이드 웹 최적화 --- */

const Container = styled.div`
    max-width: 900px; 
    margin: 40px auto; 
    padding: 0 20px;
    min-height: 100vh;
`;

const Header = styled.div`
    display: flex; align-items: center; gap: 20px; 
    margin-bottom: 30px; padding-bottom: 25px;
    border-bottom: 2px solid #f0f7ff;
`;

const BackBtn = styled.button`
    background: #f1f2f6; border: none; width: 45px; height: 45px; 
    border-radius: 50%; font-size: 20px; cursor: pointer; color: #74b9ff;
    transition: 0.2s;
    &:hover { background: #74b9ff; color: white; }
`;

const TitleCol = styled.div` display: flex; flex-direction: column; gap: 4px; `;
const Title = styled.h2` margin: 0; font-size: 26px; font-weight: 900; color: #2d3436; `;
const SubTitle = styled.span` font-size: 14px; color: #b2bec3; `;

const FormBox = styled.form`
    background: white;
    border-radius: 30px;
    padding: 40px;
    box-shadow: 0 10px 30px rgba(116, 185, 255, 0.08);
    border: 1px solid #f1f2f6;
`;

const EditorSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 30px;
`;

const TextArea = styled.textarea`
    width: 100%;
    min-height: 200px;
    border: none;
    resize: none;
    font-size: 18px;
    color: #2d3436;
    outline: none;
    line-height: 1.6;
    &::placeholder { color: #ccc; }
`;

const PreviewWrapper = styled.div`
    position: relative;
    width: 100%;
    max-height: 500px;
    border-radius: 20px;
    overflow: hidden;
    img { width: 100%; height: 100%; object-fit: contain; background: #f8fbff; }
`;

const RemoveBtn = styled.div`
    position: absolute; top: 15px; right: 15px;
    background: rgba(0,0,0,0.5); color: white;
    width: 30px; height: 30px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 14px;
    &:hover { background: #ff4757; }
`;

const ActionToolbar = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 25px;
    border-top: 2px solid #f8fbff;
`;

const MediaBtn = styled.button`
    background: #f0f7ff; color: #74b9ff;
    border: 1px solid #e1f0ff;
    padding: 12px 25px;
    border-radius: 15px;
    font-weight: bold;
    cursor: pointer;
    transition: 0.2s;
    &:hover { background: #e1f0ff; }
`;

const SubmitBtn = styled.button`
    background: ${props => props.disabled ? '#dfe6e9' : '#74b9ff'};
    color: white;
    border: none;
    padding: 12px 40px;
    border-radius: 15px;
    font-size: 16px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 5px 15px rgba(116, 185, 255, 0.3);
    transition: 0.2s;
    &:hover { 
        transform: ${props => props.disabled ? 'none' : 'translateY(-2px)'};
        background: ${props => props.disabled ? '#dfe6e9' : '#1a2a6c'};
    }
`;

export default PostCreatePage;