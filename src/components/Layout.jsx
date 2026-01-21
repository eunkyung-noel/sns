import React from 'react';
import { Outlet } from 'react-router-dom';
import styled from 'styled-components';
import Navbar from './Navbar';
import Header from './Header'; // 상단 헤더가 있다면 추가

const Layout = () => {
    return (
        <Wrapper>
            {/* 상단 헤더 (필요 시 주석 해제) */}
            {/* <Header /> */}

            <MainContent>
                <Outlet />
            </MainContent>

            <Navbar />
        </Wrapper>
    );
};

export default Layout;

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    min-height: 100vh;
    background-color: #fafafa; /* 인스타그램 스타일 배경색 */
`;

const MainContent = styled.main`
    width: 100%;
    max-width: 1200px; /* 웹사이트 주요 콘텐츠가 모이는 최대 너비 */
    margin-top: 65px;  /*  Header 높이만큼 상단 여백 (헤더가 fixed일 때 필수) */
    margin-bottom: 70px; /*  Navbar 높이만큼 하단 여백 (네비바가 하단 fixed일 때 필수) */
    padding: 20px;
    box-sizing: border-box;
    
    /* 중앙 정렬 유지 */
    display: flex;
    flex-direction: column;
    align-items: center;
`;