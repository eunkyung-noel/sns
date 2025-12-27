import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Header = () => {
    const navigate = useNavigate();

    return (
        <HeaderContainer>
            {/* 클릭 시 /feed가 아닌 소개 페이지(/about)로 이동하도록 수정 */}
            <Logo onClick={() => navigate('/about')}>🫧</Logo>
        </HeaderContainer>
    );
};

export default Header;

const HeaderContainer = styled.header`
    position: fixed; /* sticky보다 확실한 상단 고정을 위해 fixed 사용 */
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 500px;
    height: 60px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    display: flex;
    justify-content: center;
    align-items: center;
    border-bottom: 1px solid #f1f2f6;
    z-index: 1100; /* Navbar(1000)보다 위에 있거나 같은 수준 유지 */
    box-sizing: border-box;
`;

const Logo = styled.div`
    font-size: 28px; /* 아이콘 크기 조정 */
    cursor: pointer;
    user-select: none;
    transition: transform 0.2s;

    &:hover {
        transform: scale(1.1);
    }

    &:active {
        transform: scale(0.9);
    }
`;