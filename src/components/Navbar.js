import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import Swal from 'sweetalert2';

const bubbleFloat = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
  100% { transform: translateY(0px); }
`;

const Navbar = ({ setIsPostModalOpen }) => {
    const navigate = useNavigate();
    const location = useLocation();

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
            <NavInner>
                {/* 🫧 소개 페이지 추가 */}
                <NavItem
                    $active={location.pathname === '/about'}
                    onClick={() => navigate('/about')}
                >
                    🫧
                </NavItem>

                {/* 🏠 홈 & 🔍 검색 */}
                <NavItem
                    $active={location.pathname === '/feed'}
                    onClick={() => navigate('/feed')}
                >
                    🏠
                </NavItem>

                <NavItem
                    $active={location.pathname === '/search'}
                    onClick={() => navigate('/search')}
                >
                    🔍
                </NavItem>

                {/* ➕ 추가 버튼 */}
                <AddBtn onClick={() => setIsPostModalOpen(true)}>
                    ➕
                </AddBtn>

                {/* 📩 DM & 👤 프로필 & 🚪 로그아웃 */}
                <NavItem
                    $active={location.pathname === '/dm'}
                    onClick={() => navigate('/dm')}
                >
                    📩
                </NavItem>

                <NavItem
                    $active={location.pathname === '/mypage' || location.pathname === '/profile'}
                    onClick={() => navigate('/mypage')}
                >
                    👤
                </NavItem>

                <NavItem onClick={handleLogout}>🚪</NavItem>
            </NavInner>
        </NavContainer>
    );
};

export default Navbar;

const NavContainer = styled.nav`
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 70px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    display: flex;
    justify-content: center;
    align-items: center;
    border-top: 1px solid #f1f2f6;
    z-index: 1000;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
`;

const NavInner = styled.div`
    width: auto;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 30px;            /* 아이콘 개수가 늘어났으므로 간격을 30px로 조정 */
    padding: 0 20px;
    box-sizing: border-box;

    @media (min-width: 1024px) {
        gap: 50px;
    }
`;

const NavItem = styled.div`
    font-size: 26px;
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
    width: 50px;          /* 다른 버튼들과의 조화를 위해 크기 살짝 조정 */
    height: 50px;
    background: #74b9ff;
    color: white;
    border-radius: 50%;
    font-size: 22px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(116, 185, 255, 0.4);
    transition: 0.3s;
    animation: ${bubbleFloat} 3.5s ease-in-out infinite;
    margin: 0 5px;

    &:hover {
        background: #0984e3;
        transform: scale(1.1) translateY(-3px);
    }
`;