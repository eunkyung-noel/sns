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
            // 백엔드의 비밀번호 찾기 API 호출
            await api.post('/api/auth/forgot-password', { email });
            await Swal.fire({
                icon: 'success',
                title: 'Check your email',
                text: 'A password reset link has been sent to your email.',
                confirmButtonColor: '#74b9ff'
            });
            navigate('/login');
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Request Failed',
                text: err.response?.data?.message || 'Please check the email address.',
                confirmButtonColor: '#74b9ff'
            });
        }
    };

    return (
        <Container>
            <Box>
                <Title>Forgot Password ☁️</Title>
                <SubTitle>Enter your email to reset your password.</SubTitle>
                <Form onSubmit={handleResetPassword}>
                    <Input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Button type="submit">Send Reset Link</Button>
                </Form>
                <BackLink onClick={() => navigate('/login')}>Back to Login</BackLink>
            </Box>
        </Container>
    );
};

export default ForgotPage;

/* --- Styles --- */
const Container = styled.div` display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f0f8ff; `;
const Box = styled.div` background: white; padding: 40px; border-radius: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); width: 100%; max-width: 400px; `;
const Title = styled.h2` text-align: center; color: #74b9ff; margin-bottom: 10px; `;
const SubTitle = styled.p` text-align: center; color: #888; font-size: 14px; margin-bottom: 30px; `;
const Form = styled.form` display: flex; flex-direction: column; gap: 15px; `;
const Input = styled.input` padding: 15px; border-radius: 15px; border: 1px solid #eee; outline: none; font-size: 14px; &:focus { border-color: #74b9ff; } `;
const Button = styled.button` padding: 15px; border-radius: 15px; border: none; background: #74b9ff; color: white; font-weight: bold; cursor: pointer; transition: 0.3s; &:hover { background: #0984e3; } `;
const BackLink = styled.p` text-align: center; margin-top: 20px; color: #aaa; font-size: 13px; cursor: pointer; &:hover { text-decoration: underline; } `;