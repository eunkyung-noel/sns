import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import api from '../../api/api';
import Swal from 'sweetalert2';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        nickname: '',
        email: '',
        birthDate: '',
        password: '',
        confirmPassword: ''
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // [추가] 생년월일로 나이 계산하는 함수
    const calculateAge = (birthDate) => {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            return Swal.fire('알림', '비밀번호가 일치하지 않습니다.', 'warning');
        }

        try {
            // [교정] DB 컬럼 구조에 맞춰 age를 계산하여 포함
            const userAge = calculateAge(formData.birthDate);

            await api.post('/auth/register', {
                name: formData.name,
                nickname: formData.nickname,
                email: formData.email,
                birthDate: formData.birthDate,
                age: userAge, // [필수] DB의 age 컬럼에 저장될 값
                password: formData.password
            });

            await Swal.fire('성공', '회원가입 완료! 로그인 해주세요.', 'success');
            navigate('/login');
        } catch (err) {
            const msg = err.response?.data?.message || '회원가입 실패';
            Swal.fire('실패', msg, 'error');
        }
    };

    return (
        <Container>
            <RegisterBox>
                <Title>Join Bubble 🫧</Title>
                <Form onSubmit={handleRegister}>
                    <Input name="name" placeholder="성함" onChange={handleChange} required />
                    <Input name="nickname" placeholder="닉네임" onChange={handleChange} required />
                    <Input name="email" type="email" placeholder="이메일" onChange={handleChange} required />
                    <Input name="birthDate" type="date" placeholder="생년월일" onChange={handleChange} required />
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

// 스타일 컴포넌트 생략 (이전과 동일)
const Container = styled.div` display:flex; justify-content:center; align-items:center; height:100vh; background:#f0f8ff; `;
const RegisterBox = styled.div` background:white; padding:40px; border-radius:30px; width:400px; text-align:center; `;
const Title = styled.h2` color:#74b9ff; margin-bottom:30px; `;
const Form = styled.form` display:flex; flex-direction:column; gap:10px; `;
const Input = styled.input` padding:12px; border-radius:10px; border:1px solid #eee; `;
const Button = styled.button` padding:12px; border-radius:10px; background:#74b9ff; color:white; border:none; cursor:pointer; `;
const LoginLink = styled(Link)` display: block; margin-top: 15px; color: #74b9ff; text-decoration: none; `;