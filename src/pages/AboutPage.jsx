import React from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';

const AboutPage = () => {
    const navigate = useNavigate();

    return (
        <Container>
            {/* 배경에 떠다니는 비눗방울 효과 */}
            <FloatingBubble style={{ width: '100px', height: '100px', left: '10%', top: '20%', animationDelay: '0s' }} />
            <FloatingBubble style={{ width: '60px', height: '60px', left: '80%', top: '10%', animationDelay: '1s' }} />
            <FloatingBubble style={{ width: '40px', height: '40px', left: '15%', top: '70%', animationDelay: '2s' }} />
            <FloatingBubble style={{ width: '80px', height: '80px', left: '70%', top: '80%', animationDelay: '0.5s' }} />

            <ContentCard>
                <HeaderRow>
                    <BackButton onClick={() => navigate(-1)}>← 돌아가기</BackButton>
                </HeaderRow>

                {/* [Fact] 여는 태그와 닫는 태그를 HeroSection으로 통일 */}
                <HeroSection>
                    <EmojiContainer>🫧</EmojiContainer>
                    <Title>버블 피드는 어떤 곳인가요?</Title>
                </HeroSection>

                <SectionBox>
                    <IconWrapper>🛡️</IconWrapper>
                    <SectionContent>
                        <h3>깨끗한 언어 환경</h3>
                        <p>욕설이나 비속어는 실시간으로 감지되어 몽글몽글한 <b>'🫧'</b> 아이콘으로 변환됩니다. 누구나 마음 상하지 않고 대화할 수 있는 환경을 지향합니다.</p>
                    </SectionContent>
                </SectionBox>

                <SectionBox>
                    <IconWrapper>🫧</IconWrapper>
                    <SectionContent>
                        <h3>모두를 위한 소통</h3>
                        <p>🐠 미성년자와 🐳 성인이 함께 어우러지는 건강한 커뮤니티입니다. 서로를 존중하는 문화를 만들어가요.</p>
                    </SectionContent>
                </SectionBox>

                <FooterBtn onClick={() => navigate('/feed')}>피드로 둥둥 떠나기 🚀</FooterBtn>
            </ContentCard>
        </Container>
    );
};

/* --- 애니메이션 정의 --- */
const float = keyframes`
    0% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(2deg); }
    100% { transform: translateY(0px) rotate(0deg); }
`;

const bubbleRise = keyframes`
    0% { transform: translateY(0) scale(1); opacity: 0.3; }
    50% { transform: translateY(-30px) scale(1.1); opacity: 0.5; }
    100% { transform: translateY(0) scale(1); opacity: 0.3; }
`;

/* --- 스타일 정의 --- */
const Container = styled.div`
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #e0f2ff 0%, #ffffff 100%);
    padding: 20px;
    position: relative;
    overflow: hidden;
`;

const FloatingBubble = styled.div`
    position: absolute;
    background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), rgba(116, 185, 255, 0.2));
    border-radius: 50%;
    box-shadow: inset -5px -5px 15px rgba(116, 185, 255, 0.3);
    animation: ${bubbleRise} 6s ease-in-out infinite;
    z-index: 0;
`;

const ContentCard = styled.div`
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(15px);
    padding: 50px;
    border-radius: 50px;
    max-width: 650px;
    width: 100%;
    box-shadow: 0 30px 60px rgba(116, 185, 255, 0.15);
    text-align: center;
    position: relative;
    z-index: 1;
    border: 2px solid #ffffff;
    animation: ${float} 5s ease-in-out infinite;
`;

const HeaderRow = styled.div`
    display: flex;
    justify-content: flex-start;
    margin-bottom: 20px;
`;

const BackButton = styled.button`
    background: #ffffff;
    border: none;
    color: #74b9ff;
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    &:hover { background: #f0f7ff; }
`;

const HeroSection = styled.div` margin-bottom: 40px; `;

const EmojiContainer = styled.div`
    font-size: 80px;
    margin-bottom: 10px;
    filter: drop-shadow(0 10px 15px rgba(116, 185, 255, 0.3));
`;

const Title = styled.h2`
    color: #2d3436;
    font-size: 2.2rem;
    font-weight: 800;
    letter-spacing: -1px;
`;

const SectionBox = styled.div`
    display: flex;
    align-items: center;
    background: #ffffff;
    padding: 25px;
    border-radius: 30px;
    margin-bottom: 20px;
    text-align: left;
    box-shadow: 0 10px 25px rgba(116, 185, 255, 0.08);
    transition: 0.3s;
    &:hover { transform: scale(1.02); }
`;

const IconWrapper = styled.div`
    font-size: 40px;
    margin-right: 20px;
`;

const SectionContent = styled.div`
    h3 { color: #74b9ff; margin-bottom: 5px; font-size: 1.2rem; }
    p { color: #636e72; line-height: 1.5; font-size: 0.95rem; margin: 0; }
`;

const FooterBtn = styled.button`
    background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
    color: white;
    border: none;
    padding: 18px 50px;
    border-radius: 35px;
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 10px 25px rgba(9, 132, 227, 0.3);
    margin-top: 20px;
    transition: 0.3s;
    &:hover {
        transform: translateY(-3px) scale(1.05);
        box-shadow: 0 15px 30px rgba(9, 132, 227, 0.4);
    }
`;

export default AboutPage;