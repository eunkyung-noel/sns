import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Header = () => {
    const navigate = useNavigate();

    return (
        <HeaderContainer>
            <InnerWrapper>
                {/* 로고 클릭 시 소개 페이지(/about)로 이동 */}
                <Logo onClick={() => navigate('/about')}>🫧 Bubble</Logo>

                {/* 웹 환경에서는 우측에 추가적인 메뉴나 공간이 필요할 수 있어 InnerWrapper로 감쌉니다 */}
                <NavPlaceholder />
            </InnerWrapper>
        </HeaderContainer>
    );
};

export default Header;

/* --- 스타일: 모바일 규격을 탈피하고 웹 상단 고정 바 디자인 적용 --- */

const HeaderContainer = styled.header`
    position: fixed;
    top: 0;
    left: 0;                /* 전체 너비를 위해 0으로 수정 */
    width: 100%;            /* 화면 전체 가로 폭 사용 */
    height: 70px;           /* 높이 약간 확대 (60px -> 70px) */
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(15px);
    border-bottom: 1px solid #f1f2f6;
    z-index: 1100;
    display: flex;
    justify-content: center; /* 내부 요소를 중앙 정렬하기 위함 */
    box-sizing: border-box;
    transition: all 0.3s ease;
`;

const InnerWrapper = styled.div`
    width: 100%;
    max-width: 1200px;      /*  웹 콘텐츠 표준 너비 적용 */
    padding: 0 40px;        /* 좌우 여백 확보 */
    display: flex;
    justify-content: space-between; /* 로고를 왼쪽으로, 나머지를 오른쪽으로 */
    align-items: center;
`;

const Logo = styled.div`
    font-size: 32px;        /* 로고 크기 확대 */
    font-weight: 800;
    color: #74b9ff;         /* 서비스 메인 컬러 적용 */
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: transform 0.2s;

    &:hover {
        transform: scale(1.05);
    }

    &:active {
        transform: scale(0.95);
    }
`;

const NavPlaceholder = styled.div`
    /* 필요 시 우측 메뉴(알림, 프로필 등)가 들어갈 공간 */
    width: 40px;
`;