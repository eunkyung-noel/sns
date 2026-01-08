import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

const bubbleFloat = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
  100% { transform: translateY(0px); }
`;

function Header() {
    const navigate = useNavigate();

    return (
        <HeaderContainer>
            <InnerContent>
                {/* 로고를 왼쪽이나 중앙 중 원하는 곳에 배치 가능 (현재는 중앙) */}
                <BubbleLogo onClick={() => navigate('/about')}>🫧</BubbleLogo>

                {/* 만약 우측에 메뉴를 추가할 계획이라면 여기에 위치시키면 됩니다 */}
            </InnerContent>
        </HeaderContainer>
    );
}

export default Header;

const HeaderContainer = styled.header`
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    position: fixed;
    top: 0;
    left: 0;          
    width: 100%;       
    height: 65px;      
    z-index: 1100;
`;

const InnerContent = styled.div`
    width: 100%;
    max-width: 1200px; 
    display: flex;
    justify-content: center; 
    align-items: center;
    padding: 0 20px;
    box-sizing: border-box;
`;

const BubbleLogo = styled.div`
    font-size: 32px; 
    cursor: pointer;
    animation: ${bubbleFloat} 3s ease-in-out infinite;
    user-select: none;
    transition: transform 0.2s;

    &:hover {
        transform: scale(1.2);
    }
`;