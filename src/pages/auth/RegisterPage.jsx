import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import api from '../../api/api';
import Swal from 'sweetalert2';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        nickname: '', email: '', birthdate: '', password: '', confirmPassword: ''
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            // 🔍 데이터 전송
            await api.post('/auth/register', {
                nickname: formData.nickname,
                email: formData.email,
                birthdate: formData.birthdate,
                password: formData.password
            });

            await Swal.fire('성공', '회원가입 완료! 로그인 해주세요.', 'success');
            navigate('/login');
        } catch (err) {
            // 🔍 여기서 세션 만료가 뜨는지 확인
            const msg = err.response?.data?.message || '회원가입 실패';
            Swal.fire('실패', msg, 'error');
        }
    };

    return (
        <Container>
            <RegisterBox>
                <Title>Join Bubble 🫧</Title>
                <Form onSubmit={handleRegister}>
                    <Input name="nickname" placeholder="닉네임" onChange={handleChange} required />
                    <Input name="email" type="email" placeholder="이메일" onChange={handleChange} required />
                    <Input name="birthdate" type="date" placeholder="생년월일" onChange={handleChange} required />
                    <Input name="password" type="password" placeholder="비번설정" onChange={handleChange} required />
                    <Input name="confirmPassword" type="password" placeholder="비번확인" onChange={handleChange} required />
                    <Button type="submit">가입하기</Button>
                </Form>
                <LoginLink to="/login">로그인하러 가기</LoginLink>
            </RegisterBox>
        </Container>
    );
};

export default RegisterPage;

const Container = styled.div` display:flex; justify-content:center; align-items:center; height:100vh; background:#f0f8ff; `;
const RegisterBox = styled.div` background:white; padding:40px; border-radius:30px; width:400px; text-align:center; `;
const Title = styled.h2` color:#74b9ff; margin-bottom:30px; `;
const Form = styled.form` display:flex; flex-direction:column; gap:10px; `;
const Input = styled.input` padding:12px; border-radius:10px; border:1px solid #eee; `;
const Button = styled.button` padding:12px; border-radius:10px; background:#74b9ff; color:white; border:none; cursor:pointer; `;
const LoginLink = styled(Link)` display: block; margin-top: 15px; color: #74b9ff; text-decoration: none; `;