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
            const res = await api.post('/auth/register', {
                username: formData.username,
                name: formData.name,
                email: formData.email,
                birthdate: formData.birthdate,
                password: formData.password
            });

            if (res.status === 201 || res.status === 200) {
                await Swal.fire('성공', '회원가입 완료! 🫧', 'success');
                navigate('/login');
            }
        } catch (err) {
            const message = err.response?.data?.message || '가입 실패';
            Swal.fire('실패', message, 'error');
        }
    };

    return (
        <Container>
            <Card>
                <Title>비눗방울 가입 🫧</Title>
                <Form onSubmit={handleSignup}>
                    <Input
                        name="username"
                        placeholder="아이디(닉네임)"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        name="name"
                        placeholder="이름"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        name="email"
                        type="email"
                        placeholder="이메일"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <Label>생년월일</Label>
                    <Input
                        name="birthdate"
                        type="date"
                        value={formData.birthdate}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        name="password"
                        type="password"
                        placeholder="비밀번호"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        name="confirmPassword"
                        type="password"
                        placeholder="비밀번호 확인"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />
                    <SubmitBtn type="submit">가입하기</SubmitBtn>
                </Form>
            </Card>
        </Container>
    );
};

export default SignupPage;

/* ===== styled-components (기존 디자인 그대로) ===== */

const Container = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: #f0faff;
    padding: 20px;
`;

const Card = styled.div`
    background: white;
    padding: 40px;
    border-radius: 20px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.05);
    width: 100%;
    max-width: 400px;
`;

const Title = styled.h2`
    text-align: center;
    color: #74b9ff;
    margin-bottom: 25px;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 15px;
`;

const Label = styled.label`
    font-size: 12px;
    color: #888;
    margin-bottom: -10px;
    margin-left: 5px;
`;

const Input = styled.input`
    padding: 12px;
    border: 1px solid #eee;
    border-radius: 8px;
    outline: none;
`;

const SubmitBtn = styled.button`
    background: #74b9ff;
    color: white;
    border: none;
    padding: 15px;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
`;
