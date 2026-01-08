import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import api from '../api/api';
import Swal from 'sweetalert2';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { email, password });

            const token = res.data.token;
            const userId = res.data.user.id;

            localStorage.setItem('token', token);
            localStorage.setItem('userId', userId);

            await Swal.fire({
                icon: 'success',
                title: '로그인 성공!',
                text: '버블 피드에 오신 것을 환영합니다 🫧',
                timer: 1500,
                showConfirmButton: false
            });

            navigate('/');
            window.location.reload();
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: '로그인 실패',
                text: '이메일 또는 비밀번호를 확인해주세요.',
                confirmButtonColor: '#74b9ff'
            });
        }
    };

    return (
        <Container>
            <LoginBox>
                <Title>Welcome Back 🫧</Title>
                <SubTitle>더 깨끗한 소통, 버블 피드에 로그인하세요.</SubTitle>
                <Form onSubmit={handleLogin}>
                    <Input
                        type="email"
                        placeholder="이메일 주소"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        type="password"
                        placeholder="비밀번호"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <SubmitButton type="submit">시작하기</SubmitButton>
                </Form>

                <HelperMenu>
                    <HelperLink to="/register">회원가입</HelperLink>
                    <Divider>|</Divider>
                    <HelperLink to="/find-password">비밀번호 찾기</HelperLink>
                </HelperMenu>

                <FooterInfo>
                    계정이 없으신가요? <b>Bubble</b>과 함께 시작해보세요.
                </FooterInfo>
            </LoginBox>
        </Container>
    );
};

export default LoginPage;

/* --- 웹 최적화 스타일 --- */

const Container = styled.div`
    display: flex; 
    justify-content: center; 
    align-items: center;
    height: 100vh; 
    background: radial-gradient(circle at top, #f0f8ff 0%, #ffffff 100%);
`;

const LoginBox = styled.div`
    background: white; 
    padding: 60px 50px;
    border-radius: 50px;      
    width: 100%; 
    max-width: 500px;
    text-align: center;
    box-shadow: 0 30px 60px rgba(116, 185, 255, 0.12);
`;

const Title = styled.h2`
    font-size: 34px;          
    font-weight: 900;
    color: #1a2a6c;
    margin-bottom: 12px;
`;

const SubTitle = styled.p`
    font-size: 16px;
    color: #95a5a6;          
    margin-bottom: 45px;
`;

const Form = styled.form`
    display: flex; 
    flex-direction: column; 
    gap: 18px;
`;

const Input = styled.input`
    padding: 20px 25px;       
    border-radius: 25px;     
    border: 1px solid #f1f2f6;
    background: #f8fbff;
    font-size: 16px;
    outline: none;
    transition: all 0.2s;

    &:focus {
        border-color: #74b9ff;
        background: white;
        box-shadow: 0 0 0 5px rgba(116, 185, 255, 0.08);
    }
`;

const SubmitButton = styled.button`
    padding: 20px; 
    border-radius: 25px;
    background: #74b9ff; 
    color: white; 
    border: none; 
    cursor: pointer;
    font-size: 18px;
    font-weight: bold;
    margin-top: 15px;
    transition: all 0.3s;

    &:hover {
        background: #0984e3;
        transform: translateY(-3px);
        box-shadow: 0 15px 30px rgba(9, 132, 227, 0.2);
    }
`;

/* --- 비밀번호 찾기 포함 하단 메뉴 --- */
const HelperMenu = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 35px;
    gap: 15px;
`;

const HelperLink = styled(Link)`
    font-size: 15px;
    color: #74b9ff;
    text-decoration: none;
    font-weight: 700;
    transition: 0.2s;

    &:hover {
        color: #0984e3;
        text-decoration: underline;
    }
`;

const Divider = styled.span`
    color: #dfe6e9;
    font-size: 12px;
`;

const FooterInfo = styled.div`
    margin-top: 25px;
    font-size: 14px;
    color: #b2bec3;
    b { color: #74b9ff; }
`;