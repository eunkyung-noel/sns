import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <HomeContainer>
            <Navbar>
                <div className="logo" onClick={() => navigate('/')}>🫧 Bubble Feed</div>
                <div className="nav-links">
                    {/* [Fact] 요청하신 소개 페이지 연동 추가 */}
                    <span onClick={() => navigate('/about')}>🫧 소개</span>
                    <span onClick={() => navigate('/login')}>로그인</span>
                    <button className="signup-btn" onClick={() => navigate('/register')}>시작하기</button>
                </div>
            </Navbar>

            <HeroSection>
                <Badge>v1.0.0 Stable</Badge>
                <MainTitle>
                    더 투명하고<br />
                    <span>깨끗한 소통</span>의 공간
                </MainTitle>
                <Description>
                    실시간 비속어 필터링으로 마음 편히 소통할 수 있는 커뮤니티,<br />
                    지금 바로 버블 피드에서 일상을 나눠보세요.
                </Description>

                <MainBtn onClick={() => navigate('/feed')}>
                    피드 구경하러 가기 🚀
                </MainBtn>
            </HeroSection>

            <FeatureGrid>
                <FeatureCard className="highlight">
                    <div className="icon">🫧</div>
                    <h3>세대 간 소통</h3>
                    <p>미성년자🐠 와 성인🐳이 건강하게 소통하는 공간</p>
                </FeatureCard>

                <FeatureCard className="highlight">
                    <div className="icon">🛡️</div>
                    <h3>클린 시스템</h3>
                    <p>부적절한 언어는 자동으로 🫧 버블로 변환되어 안전합니다.</p>
                </FeatureCard>

                <FeatureCard className="highlight">
                    <div className="icon">⚡</div>
                    <h3>실시간 소통</h3>
                    <p>친구들의 소식을 실시간으로 확인하고 빠르게 반응하세요.</p>
                </FeatureCard>

                <FeatureCard className="highlight">
                    <div className="icon">❤️</div>
                    <h3>공감과 댓글</h3>
                    <p>좋아요와 댓글로 당신의 마음을 자유롭게 표현하세요.</p>
                </FeatureCard>
            </FeatureGrid>
        </HomeContainer>
    );
};

// --- 스타일 정의 (기존 스타일 유지) ---
const HomeContainer = styled.div` 
    min-height: 100vh; 
    background: #ffffff; 
    font-family: 'Pretendard', -apple-system, sans-serif; 
`;

const Navbar = styled.nav` 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    padding: 0 10%; 
    height: 80px; 
    position: sticky;
    top: 0;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    z-index: 1000;

    .logo { font-size: 24px; font-weight: 900; color: #74b9ff; cursor: pointer; } 
    .nav-links { display: flex; align-items: center; gap: 30px; } 
    span { cursor: pointer; font-weight: 600; font-size: 15px; color: #636e72; &:hover { color: #74b9ff; } } 
    .signup-btn { 
        background: #74b9ff; color: white; border: none; padding: 10px 24px; 
        border-radius: 25px; cursor: pointer; font-weight: bold; font-size: 15px;
        transition: 0.2s; &:hover { background: #0984e3; }
    } 
`;

const HeroSection = styled.header` 
    text-align: center; 
    padding: 120px 20px 100px; 
    background: radial-gradient(circle at top, #f0f7ff 0%, #ffffff 80%); 
`;

const Badge = styled.span` 
    background: #e1f0ff; color: #0984e3; padding: 6px 16px; border-radius: 20px; 
    font-size: 14px; font-weight: bold; display: inline-block; margin-bottom: 25px;
`;

const MainTitle = styled.h1` 
    font-size: 4.5rem; 
    color: #2d3436; 
    line-height: 1.1; 
    font-weight: 800;
    span { color: #74b9ff; } 
    @media (max-width: 1024px) { font-size: 3.5rem; }
`;

const Description = styled.p` 
    color: #636e72; 
    font-size: 1.3rem; 
    margin: 30px 0 50px; 
    line-height: 1.8; 
    word-break: keep-all;
`;

const MainBtn = styled.button` 
    background: #0984e3; color: white; border: none; padding: 22px 50px; border-radius: 40px; 
    font-size: 1.25rem; font-weight: bold; cursor: pointer; box-shadow: 0 10px 30px rgba(9, 132, 227, 0.3); 
    transition: 0.3s; 
    &:hover { transform: translateY(-5px); box-shadow: 0 15px 35px rgba(9, 132, 227, 0.4); } 
`;

const FeatureGrid = styled.div` 
    display: grid; 
    grid-template-columns: repeat(2, 1fr); 
    gap: 40px; 
    max-width: 1100px; 
    margin: 0 auto 120px; 
    padding: 0 20px;
    @media (max-width: 768px) { grid-template-columns: 1fr; } 
`;

const FeatureCard = styled.div` 
    padding: 50px; 
    border-radius: 30px; 
    text-align: center; 
    transition: 0.4s; 
    background: #f8f9fa; 
    border: 1px solid transparent;
    
    &.highlight {
        background: #f0f7ff;
        border: 1px solid #e1f0ff;
    }
    &.highlight h3 { color: #74b9ff; }

    .icon { font-size: 50px; margin-bottom: 25px; } 
    h3 { margin-bottom: 18px; color: #2d3436; font-size: 1.5rem; font-weight: 700; } 
    p { color: #636e72; font-size: 16px; line-height: 1.6; word-break: keep-all; } 
    
    &:hover { 
        background: #ffffff; 
        box-shadow: 0 30px 60px rgba(116, 185, 255, 0.15); 
        transform: translateY(-15px); 
        border-color: #74b9ff;
    } 
`;

export default HomePage;