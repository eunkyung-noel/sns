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
            {/* 🔍 로고를 🫧로 변경 및 /about으로 연결 */}
            <BubbleLogo onClick={() => navigate('/about')}>🫧</BubbleLogo>
        </HeaderContainer>
    );
}

export default Header;

const HeaderContainer = styled.div`
    display: flex;
    justify-content: center; /* 🔍 중앙 정렬 */
    align-items: center;
    padding: 10px 0;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    position: fixed; /* 🔍 상단 고정 */
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 500px;
    height: 60px;
    z-index: 1100;
`;

const BubbleLogo = styled.div`
    font-size: 30px;
    cursor: pointer;
    animation: ${bubbleFloat} 3s ease-in-out infinite;
    user-select: none;
    transition: transform 0.2s;

    &:hover {
        transform: scale(1.2);
    }
`;