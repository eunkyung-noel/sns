import React, { useState } from 'react';
import styled from 'styled-components';
import api from '../api/api';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const SignupPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        name: '',
        email: '',
        birthdate: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        if (
            !formData.username ||
            !formData.name ||
            !formData.email ||
            !formData.birthdate ||
            !formData.password
        ) {
            return Swal.fire('오류', '모든 항목을 입력해주세요.', 'error');
        }

        if (formData.password !== formData.confirmPassword) {
            return Swal.fire('오류', '비밀번호가 일치하지 않습니다.', 'error');
        }

        try {
            // [Fact] 백엔드 POST /api/auth/register 호출
            const res = await api.post('/auth/register', {
                username: formData.username,
                name: formData.name,
                email: formData.email,
                birthdate: formData.birthdate,
                password: formData.password
            });

            if (res.status === 201 || res.status === 200) {
                await Swal.fire({
                    icon: 'success',
                    title: '회원가입 완료!',
                    text: '비눗방울의 세계에 오신 것을 환영합니다. 🫧',
                    timer: 2000,
                    showConfirmButton: false
                });
                navigate('/login');
            }
        } catch (err) {
            const message = err.response?.data?.message || '가입 실패';
            Swal.fire('실패', message, 'error');
        }
    };

    return (
        <Container>
            <SignupWrapper>
                {/* 왼쪽: 브랜드 섹션 */}
                <BrandSection>
                    <div className="logo">🫧</div>
                    <BrandTitle>비눗방울</BrandTitle>
                    <BrandDesc>
                        당신의 소중한 순간들을 <br />
                        가볍고 아름답게 띄워보세요.
                    </BrandDesc>
                    <LoginLink onClick={() => navigate('/login')}>
                        이미 계정이 있으신가요? <b>로그인하기</b>
                    </LoginLink>
                </BrandSection>

                {/* 오른쪽: 입력 폼 섹션 */}
                <FormSection>
                    <FormTitle>새로운 계정 만들기</FormTitle>
                    <Form onSubmit={handleSignup}>
                        <InputGroup>
                            <label>사용자 아이디 (닉네임)</label>
                            <Input
                                name="username"
                                placeholder="아이디를 입력하세요"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </InputGroup>

                        <InputGroup>
                            <label>이름</label>
                            <Input
                                name="name"
                                placeholder="실명을 입력하세요"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </InputGroup>

                        <InputGroup>
                            <label>이메일</label>
                            <Input
                                name="email"
                                type="email"
                                placeholder="example@bubble.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </InputGroup>

                        <InputGroup>
                            <label>생년월일</label>
                            <Input
                                name="birthdate"
                                type="date"
                                value={formData.birthdate}
                                onChange={handleChange}
                                required
                            />
                        </InputGroup>

                        <TwoColumnRow>
                            <InputGroup>
                                <label>비밀번호</label>
                                <Input
                                    name="password"
                                    type="password"
                                    placeholder="문자/숫자 조합"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </InputGroup>
                            <InputGroup>
                                <label>비밀번호 확인</label>
                                <Input
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="한 번 더 입력"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </InputGroup>
                        </TwoColumnRow>

                        <SubmitBtn type="submit">회원가입 시작하기</SubmitBtn>
                    </Form>
                </FormSection>
            </SignupWrapper>
        </Container>
    );
};

/* --- 스타일 정의 --- */

const Container = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: #f0f7ff;
    padding: 20px;
`;

const SignupWrapper = styled.div`
    display: flex;
    width: 100%;
    max-width: 900px; /* 🔍 와이드 규격 통일 */
    background: white;
    border-radius: 30px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(116, 185, 255, 0.15);
    border: 1px solid #e1f0ff;
`;

const BrandSection = styled.div`
    flex: 1;
    background: linear-gradient(135deg, #74b9ff 0%, #1a2a6c 100%);
    padding: 60px;
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;

    .logo { font-size: 80px; margin-bottom: 20px; }
    
    @media (max-width: 768px) { display: none; }
`;

const BrandTitle = styled.h1` font-size: 40px; font-weight: 900; margin: 0 0 20px 0; `;
const BrandDesc = styled.p` font-size: 18px; line-height: 1.6; opacity: 0.9; margin-bottom: 40px; `;

const LoginLink = styled.div`
    font-size: 14px; color: rgba(255,255,255,0.8); cursor: pointer;
    b { text-decoration: underline; color: white; }
    &:hover b { color: #f1f2f6; }
`;

const FormSection = styled.div`
    flex: 1.2;
    padding: 60px;
    background: white;
`;

const FormTitle = styled.h2`
    font-size: 28px; font-weight: 900; color: #2d3436; margin-bottom: 35px;
`;

const Form = styled.form` display: flex; flex-direction: column; gap: 20px; `;

const InputGroup = styled.div`
    display: flex; flex-direction: column; gap: 8px;
    label { font-size: 13px; font-weight: 800; color: #74b9ff; margin-left: 2px; }
`;

const Input = styled.input`
    padding: 15px; border: 2px solid #f1f2f6; border-radius: 15px;
    outline: none; font-size: 15px; transition: 0.2s;
    &:focus { border-color: #74b9ff; background: #f8fbff; }
`;

const TwoColumnRow = styled.div`
    display: grid; grid-template-columns: 1fr 1fr; gap: 15px;
    @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const SubmitBtn = styled.button`
    margin-top: 15px;
    background: #74b9ff; color: white; border: none; padding: 18px;
    border-radius: 15px; font-size: 16px; font-weight: 900;
    cursor: pointer; transition: 0.2s;
    box-shadow: 0 8px 20px rgba(116, 185, 255, 0.3);
    &:hover { background: #1a2a6c; transform: translateY(-2px); }
`;

export default SignupPage;