import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import api from '../api/api'; // 🔍 교정: ../../ 를 ../ 로 수정
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
                timer: 1000,
                showConfirmButton: false
            });

            navigate('/');
            window.location.reload();
        } catch (err) {
            Swal.fire('오류', '로그인 정보를 확인하세요.', 'error');
        }
    };

    return (
        <Container>
            <LoginBox>
                <Title>Welcome 🫧</Title>
                <Form onSubmit={handleLogin}>
                    <Input
                        type="email"
                        placeholder="이메일"
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
                    <Button type="submit">시작하기</Button>
                </Form>
                <RegisterLink to="/register">계정이 없으신가요? 회원가입</RegisterLink>
            </LoginBox>
        </Container>
    );
};

export default LoginPage;

/* styles */
const Container = styled.div`
    display:flex; justify-content:center; align-items:center;
    height:100vh; background:#f0f8ff;
`;
const LoginBox = styled.div`
    background:white; padding:40px; border-radius:30px;
    width:100%; max-width:400px; text-align:center;
`;
const Title = styled.h2`
    text-align:center; color:#74b9ff; margin-bottom:30px;
`;
const Form = styled.form`
    display:flex; flex-direction:column; gap:15px;
`;
const Input = styled.input`
    padding:15px; border-radius:15px; border:1px solid #eee;
`;
const Button = styled.button`
    padding:15px; border-radius:15px;
    background:#74b9ff; color:white; border:none; cursor:pointer;
`;
const RegisterLink = styled(Link)`
    display: block; margin-top: 20px; color: #74b9ff;
    text-decoration: none; font-size: 14px;
    &:hover { text-decoration: underline; }
`;