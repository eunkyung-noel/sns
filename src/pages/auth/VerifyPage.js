import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';

function VerifyPage() {
    const [verificationStatus, setVerificationStatus] = useState('인증 진행 중...');
    const [isSuccess, setIsSuccess] = useState(false);

    const { token } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const verifyAccount = async () => {
            if (!token) {
                setVerificationStatus('오류: 유효한 인증 토큰이 없습니다.');
                return;
            }

            try {
                const response = await api.get(`/auth/verify/${token}`);
                setVerificationStatus(
                    response.data.message || '인증이 완료되었습니다! 로그인해 주세요.'
                );
                setIsSuccess(true);
            } catch (error) {
                console.error('인증 실패:', error);
                setVerificationStatus(
                    error.response?.data?.message || '인증에 실패했거나 만료된 링크입니다.'
                );
                setIsSuccess(false);
            }
        };

        verifyAccount();
    }, [token]);

    const goToLogin = () => {
        navigate('/login');
    };

    return (
        <Container>
            <ContentBox isSuccess={isSuccess}>
                <IconWrapper isSuccess={isSuccess}>
                    {isSuccess ? '🫧' : '⚠️'}
                </IconWrapper>
                <h1>{isSuccess ? '인증 완료' : '인증 결과'}</h1>
                <StatusText isSuccess={isSuccess}>
                    {verificationStatus}
                </StatusText>

                <Button onClick={goToLogin}>
                    로그인 페이지로 이동
                </Button>
            </ContentBox>
        </Container>
    );
}

export default VerifyPage;

/* --- 스타일: 연두색을 제거하고 하늘색(Bubble) 테마 적용 --- */

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
  background-color: #f0f8ff; /* 🔍 연두색에서 하늘색 배경으로 수정 */
`;

const ContentBox = styled.div`
  background: white;
  padding: 80px 60px;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(116, 185, 255, 0.1); /* 🔍 그림자에도 하늘색 톤 반영 */
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  max-width: 600px;
  
  h1 {
    color: ${props => (props.isSuccess ? '#74b9ff' : '#ff7675')}; /* 🔍 성공 시 하늘색 적용 */
    margin-bottom: 25px;
    font-size: 32px;
  }
`;

const IconWrapper = styled.div`
  font-size: 64px;
  margin-bottom: 20px;
`;

const StatusText = styled.p`
  font-size: 20px;
  margin-bottom: 45px;
  color: ${props => (props.isSuccess ? '#0984e3' : '#d63031')}; /* 🔍 텍스트 대비 향상 */
  font-weight: 500;
  line-height: 1.6;
`;

const Button = styled.button`
  padding: 18px 40px;
  background-color: #74b9ff; /* 🔍 메인 하늘색 적용 */
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(116, 185, 255, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #0984e3; /* 🔍 호버 시 진한 하늘색 */
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(116, 185, 255, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
`;