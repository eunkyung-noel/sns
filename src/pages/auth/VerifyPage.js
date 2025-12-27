// src/pages/auth/VerifyPage.js
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';

function VerifyPage() {
    // 1. 상태 변수 정의
    const [verificationStatus, setVerificationStatus] = useState('인증 진행 중...');
    const [isSuccess, setIsSuccess] = useState(false);

    // URL에서 토큰 값(params)을 가져오는 React Router 훅
    const { token } = useParams();
    const navigate = useNavigate();

    // 2. 컴포넌트 마운트 시 인증 API 호출
    useEffect(() => {
        const verifyAccount = async () => {
            if (!token) {
                setVerificationStatus('오류: 유효한 인증 토큰이 없습니다.');
                return;
            }

            try {
                //  백엔드 API 호출: GET /auth/verify/:token
                const response = await api.get(`/auth/verify/${token}`);

                // 인증 성공 처리
                setVerificationStatus(
                    response.data.message || '인증이 완료되었습니다! 로그인해 주세요.'
                );
                setIsSuccess(true);

            } catch (error) {
                // 인증 실패 처리
                console.error('인증 실패:', error);
                setVerificationStatus(
                    error.response?.data?.message || '인증에 실패했거나 만료된 링크입니다.'
                );
                setIsSuccess(false);
            }
        };

        verifyAccount();
    }, [token]); // token이 변경될 때만 다시 실행

    // 3. 로그인 페이지로 이동 버튼 핸들러
    const goToLogin = () => {
        navigate('/login');
    };

    return (
        <Container>
            <ContentBox isSuccess={isSuccess}>
                <h1>{isSuccess ? ' 인증 완료' : ' 인증 결과'}</h1>
                <StatusText isSuccess={isSuccess}>
                    {verificationStatus}
                </StatusText>

                {/* 성공/실패 여부와 관계없이 로그인 페이지로 이동 버튼 표시 */}
                <Button onClick={goToLogin}>
                    로그인 페이지로 이동
                </Button>
            </ContentBox>
        </Container>
    );
}

export default VerifyPage;

//  스타일 정의 (연두색/흰색 테마 사용)
const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
  background-color: #e8f5e9; /* 밝은 연두색 배경 */
`;

const ContentBox = styled.div`
  background: white;
  padding: 50px 60px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 450px;
  h1 {
    color: ${props => (props.isSuccess ? '#43a047' : '#ef5350')}; /* 성공/실패에 따라 색상 변경 */
    margin-bottom: 20px;
  }
`;

const StatusText = styled.p`
  font-size: 18px;
  margin-bottom: 30px;
  color: ${props => (props.isSuccess ? '#43a047' : '#ef5350')};
  font-weight: 500;
`;

const Button = styled.button`
  padding: 12px 25px;
  background-color: #81c784;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  transition: background-color 0.3s;
  &:hover {
    background-color: #66bb6a;
  }
`;