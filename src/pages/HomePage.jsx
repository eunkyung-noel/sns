import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <HomeContainer>
            <Navbar>
                <div className="logo">🫧 Bubble Feed</div>
                <div className="nav-links">
                    <span onClick={() => navigate('/login')}>로그인</span>
                    <button className="signup-btn" onClick={() => navigate('/register')}>시작하기</button>
                </div>
            </Navbar>

            <HeroSection>
                <Badge>v1.0.0</Badge>
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
                {/* ✅ 요청하신 슬로건 박스 (다른 박스와 동일한 스타일) */}
                <FeatureCard className="highlight">
                    <div className="icon">🫧</div>
                    <h3>세대 간 소통</h3>
                    <p>미성년자🐠 와 성인🐳이 건강하게 소통하는 공간</p>
                </FeatureCard>

                {/* ✅ 클린 시스템 박스 */}
                <FeatureCard>
                    <div className="icon">🛡️</div>
                    <h3>클린 시스템</h3>
                    <p>부적절한 언어는 자동으로 🫧 버블로 변환되어 안전합니다.</p>
                </FeatureCard>

                {/* ✅ 실시간 소통 박스 */}
                <FeatureCard>
                    <div className="icon">⚡</div>
                    <h3>실시간 소통</h3>
                    <p>친구들의 소식을 실시간으로 확인하고 빠르게 반응하세요.</p>
                </FeatureCard>

                {/* ✅ 공감과 댓글 박스 */}
                <FeatureCard>
                    <div className="icon">❤️</div>
                    <h3>공감과 댓글</h3>
                    <p>좋아요와 댓글로 당신의 마음을 자유롭게 표현하세요.</p>
                </FeatureCard>
            </FeatureGrid>
        </HomeContainer>
    );
};

// --- 스타일 정의 ---
const HomeContainer = styled.div` min-height: 100vh; background: #ffffff; font-family: 'Pretendard', sans-serif; `;

const Navbar = styled.nav` 
    display: flex; justify-content: space-between; align-items: center; padding: 20px 10%; 
    .logo { font-size: 20px; font-weight: 900; color: #74b9ff; } 
    .nav-links { display: flex; align-items: center; gap: 20px; } 
    span { cursor: pointer; font-weight: 600; font-size: 14px; color: #636e72; } 
    .signup-btn { background: #74b9ff; color: white; border: none; padding: 8px 18px; border-radius: 20px; cursor: pointer; font-weight: bold; } 
`;

const HeroSection = styled.header` 
    text-align: center; padding: 80px 20px 60px; 
    background: radial-gradient(circle at top, #f0f7ff 0%, #ffffff 70%); 
`;

const Badge = styled.span` 
    background: #e1f0ff; color: #0984e3; padding: 5px 12px; border-radius: 20px; 
    font-size: 12px; font-weight: bold; display: inline-block; margin-bottom: 20px;
`;

const MainTitle = styled.h1` 
    font-size: 3.5rem; color: #2d3436; line-height: 1.2; 
    span { color: #74b9ff; } 
    @media (max-width: 768px) { font-size: 2.5rem; }
`;

const Description = styled.p` 
    color: #636e72; font-size: 1.1rem; margin: 25px 0 40px; line-height: 1.6; 
`;

const MainBtn = styled.button` 
    background: #0984e3; color: white; border: none; padding: 18px 40px; border-radius: 35px; 
    font-size: 1.1rem; font-weight: bold; cursor: pointer; box-shadow: 0 10px 20px rgba(9, 132, 227, 0.2); 
    transition: 0.3s; &:hover { transform: translateY(-3px); box-shadow: 0 15px 25px rgba(9, 132, 227, 0.3); } 
`;

const FeatureGrid = styled.div` 
    display: grid; 
    grid-template-columns: repeat(2, 1fr); /* 4개이므로 2x2 배열로 정렬 */
    gap: 30px; 
    padding: 0 10% 100px; 
    @media (max-width: 768px) { grid-template-columns: 1fr; } 
`;

const FeatureCard = styled.div` 
    padding: 40px; border-radius: 25px; background: #f8f9fa; text-align: center; 
    transition: 0.3s; 
    
    &.highlight h3 { color: #74b9ff; } /* 슬로건 박스 제목 색상 강조 */

    .icon { font-size: 40px; margin-bottom: 20px; } 
    h3 { margin-bottom: 15px; color: #2d3436; font-size: 1.2rem; } 
    p { color: #636e72; font-size: 14px; line-height: 1.5; word-break: keep-all; } 
    
    &:hover { background: #ffffff; box-shadow: 0 20px 40px rgba(0,0,0,0.05); transform: translateY(-10px); } 
`;

export default HomePage;