import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../../api/api';
import Swal from 'sweetalert2';

const ForgotPage = () => {
    const [email, setEmail] = useState('');
    const navigate = useNavigate();

    const handleResetPassword = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/auth/forgot-password', { email });
            await Swal.fire({
                icon: 'success',
                title: '이메일을 확인해주세요',
                text: '비밀번호 재설정 링크가 전송되었습니다.',
                confirmButtonColor: '#74b9ff'
            });
            navigate('/login');
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: '요청 실패',
                text: err.response?.data?.message || '이메일 주소를 다시 확인해주세요.',
                confirmButtonColor: '#74b9ff'
            });
        }
    };

    return (
        <FullPageContainer>
            <ContentWrapper>
                {/* 왼쪽: 브랜드 이미지 또는 안내 문구 영역 */}
                <BrandSection>
                    <BrandLogo>🫧 NOEL SNS</BrandLogo>
                    <BrandMessage>
                        비밀번호를 잊으셨나요?<br/>
                        걱정 마세요. 이메일만으로 간단히 찾을 수 있습니다.
                    </BrandMessage>
                </BrandSection>

                {/* 오른쪽: 실제 입력 폼 영역 */}
                <FormSection>
                    <FormBox>
                        <Title>Forgot Password</Title>
                        <SubTitle>가입 시 사용한 이메일 주소를 입력해주세요.</SubTitle>
                        <Form onSubmit={handleResetPassword}>
                            <Label>Email Address</Label>
                            <Input
                                type="email"
                                placeholder="example@noel.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <SubmitButton type="submit">비밀번호 재설정 메일 발송</SubmitButton>
                        </Form>
                        <FooterLink onClick={() => navigate('/login')}>
                            로그인 화면으로 돌아가기
                        </FooterLink>
                    </FormBox>
                </FormSection>
            </ContentWrapper>
        </FullPageContainer>
    );
};

export default ForgotPage;

/* --- 🖥️ 웹사이트 대화면 전용 스타일 (Desktop First) --- */

const FullPageContainer = styled.div`
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f0f2f5;
`;

const ContentWrapper = styled.div`
    display: flex;
    width: 100%;
    max-width: 1000px; /* 🔍 웹사이트 규격으로 대폭 확장 */
    height: 600px;
    background: white;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.1);
    overflow: hidden;

    @media (max-width: 768px) {
        flex-direction: column;
        max-width: 400px;
        height: auto;
    }
`;

const BrandSection = styled.div`
    flex: 1;
    background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 60px;
    color: white;

    @media (max-width: 768px) {
        display: none; /* 모바일에서는 왼쪽 영역 숨김 */
    }
`;

const BrandLogo = styled.h1`
    font-size: 32px;
    margin-bottom: 20px;
`;

const BrandMessage = styled.p`
    font-size: 18px;
    line-height: 1.6;
    opacity: 0.9;
`;

const FormSection = styled.div`
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px;
`;

const FormBox = styled.div`
    width: 100%;
    max-width: 360px;
`;

const Title = styled.h2`
    font-size: 28px;
    color: #1c1e21;
    margin-bottom: 10px;
`;

const SubTitle = styled.p`
    font-size: 14px;
    color: #606770;
    margin-bottom: 30px;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
`;

const Label = styled.label`
    font-size: 12px;
    font-weight: bold;
    color: #1c1e21;
    margin-bottom: 8px;
`;

const Input = styled.input`
    padding: 14px;
    border-radius: 8px;
    border: 1px solid #dddfe2;
    font-size: 16px;
    margin-bottom: 20px;
    outline: none;
    &:focus { border-color: #1877f2; box-shadow: 0 0 0 2px #e7f3ff; }
`;

const SubmitButton = styled.button`
    padding: 14px;
    background-color: #74b9ff;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 17px;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s;
    &:hover { background-color: #0984e3; }
`;

const FooterLink = styled.p`
    text-align: center;
    margin-top: 20px;
    color: #1877f2;
    font-size: 14px;
    cursor: pointer;
    &:hover { text-decoration: underline; }
`;