import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../api/api'; // [Fact] 경로 수정: src/pages/ 위치에 맞게 조정
import Swal from 'sweetalert2';

const FindPasswordPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleFindPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // [Fact] 백엔드 엔드포인트는 실제 서버 API 명세에 따라 확인 필요
            await api.post('/auth/find-password', { email });

            Swal.fire({
                icon: 'success',
                title: '이메일 전송 완료',
                text: '입력하신 이메일로 비밀번호 재설정 안내를 보냈습니다. 🫧',
                confirmButtonColor: '#74b9ff'
            });
            navigate('/login');
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: '확인 불가',
                text: err.response?.data?.message || '등록되지 않은 이메일이거나 오류가 발생했습니다.',
                confirmButtonColor: '#74b9ff'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container>
            <FindCard>
                <Emoji>🔑</Emoji>
                <Title>비밀번호를 잊으셨나요?</Title>
                <Desc>가입하셨던 이메일 주소를 입력하시면<br/>비밀번호 재설정 링크를 보내드릴게요.</Desc>

                <Form onSubmit={handleFindPassword}>
                    <InputGroup>
                        <input
                            type="email"
                            placeholder="example@bubble.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </InputGroup>
                    <SubmitBtn type="submit" disabled={isLoading}>
                        {isLoading ? '전송 중...' : '링크 보내기 🫧'}
                    </SubmitBtn>
                </Form>

                <BackToLogin onClick={() => navigate('/login')}>
                    로그인 페이지로 돌아가기
                </BackToLogin>
            </FindCard>
        </Container>
    );
};

/* --- 스타일 정의 --- */
const Container = styled.div`
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: radial-gradient(circle at top, #f0f8ff 0%, #ffffff 100%);
`;

const FindCard = styled.div`
    background: white;
    padding: 60px 40px;
    border-radius: 50px; /* 🔍 버블 컨셉: 40px -> 50px */
    box-shadow: 0 30px 60px rgba(116, 185, 255, 0.12);
    width: 100%;
    max-width: 450px;
    text-align: center;
`;

const Emoji = styled.div` font-size: 60px; margin-bottom: 20px; `;

const Title = styled.h2`
    color: #1a2a6c;
    margin-bottom: 15px;
    font-size: 1.8rem;
    font-weight: 900;
`;

const Desc = styled.p`
    color: #95a5a6;
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 40px;
`;

const Form = styled.form` display: flex; flex-direction: column; gap: 20px; `;

const InputGroup = styled.div`
    input {
        width: 100%;
        padding: 20px 25px;
        border-radius: 25px; /* 🔍 버블 컨셉: 더 동글동글하게 */
        border: 1px solid #f1f2f6;
        background: #f8fbff;
        font-size: 16px;
        box-sizing: border-box;
        transition: 0.3s;
        outline: none;
        &:focus { 
            border-color: #74b9ff; 
            background: white; 
            box-shadow: 0 0 0 5px rgba(116, 185, 255, 0.08); 
        }
    }
`;

const SubmitBtn = styled.button`
    background: #74b9ff;
    color: white;
    border: none;
    padding: 20px;
    border-radius: 25px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    transition: 0.3s;
    &:disabled { background: #dfe6e9; cursor: not-allowed; }
    &:hover:not(:disabled) { 
        background: #0984e3; 
        transform: translateY(-3px); 
        box-shadow: 0 15px 30px rgba(9, 132, 227, 0.2); 
    }
`;

const BackToLogin = styled.div`
    margin-top: 35px;
    font-size: 15px;
    color: #b2bec3;
    cursor: pointer;
    text-decoration: underline;
    &:hover { color: #74b9ff; }
`;

export default FindPasswordPage;