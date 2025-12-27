import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import Swal from 'sweetalert2';

// 둥실둥실 비눗방울 애니메이션 (사용자 제공 Header 컨셉 유지)
const bubbleFloat = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
  100% { transform: translateY(0px); }
`;

const Navbar = ({ setIsPostModalOpen }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // 로그아웃 처리
    const handleLogout = () => {
        Swal.fire({
            title: '로그아웃',
            text: "비눗방울을 터뜨릴까요?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#74b9ff',
            confirmButtonText: '네',
            cancelButtonText: '아니오'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.clear();
                window.location.href = '/login';
            }
        });
    };

    return (
        <NavContainer>
            <NavItem $active={location.pathname === '/feed'} onClick={() => navigate('/feed')}>🏠</NavItem>
            <NavItem $active={location.pathname === '/search'} onClick={() => navigate('/search')}>🔍</NavItem>

            {/* 중앙 게시글 작성 버튼 */}
            <AddBtn onClick={() => setIsPostModalOpen(true)}>➕</AddBtn>

            <NavItem $active={location.pathname === '/dm'} onClick={() => navigate('/dm')}>📩</NavItem>
            <NavItem $active={location.pathname === '/profile'} onClick={() => navigate('/profile')}>👤</NavItem>

            {/* 마지막 로그아웃 아이콘 추가 */}
            <NavItem onClick={handleLogout}>🚪</NavItem>
        </NavContainer>
    );
};

export default Navbar;

const NavContainer = styled.nav`
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 500px;
    height: 75px;
    background: #ffffff;
    display: flex;
    justify-content: space-around; /* 6개 아이콘을 균등 분할 */
    align-items: center;
    border-top: 1px solid #f1f2f6;
    z-index: 1000;
    box-shadow: 0 -5px 15px rgba(0,0,0,0.05);
`;

const NavItem = styled.div`
    font-size: 22px;
    cursor: pointer;
    transition: 0.3s;
    opacity: ${props => (props.$active ? '1' : '0.4')};
    animation: ${bubbleFloat} 3s ease-in-out infinite;
    
    &:hover {
        opacity: 1;
        transform: scale(1.2);
    }
`;

const AddBtn = styled.div`
    width: 48px;
    height: 48px;
    background: #74b9ff;
    color: white;
    border-radius: 50%;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    /* 비눗방울 입체감 그림자 */
    box-shadow: inset -4px -4px 8px rgba(0,0,0,0.1), 0 6px 12px rgba(116, 185, 255, 0.3);
    transition: 0.3s;
    animation: ${bubbleFloat} 3.5s ease-in-out infinite;

    &:hover {
        background: #0984e3;
        transform: scale(1.1) translateY(-3px);
    }
`;