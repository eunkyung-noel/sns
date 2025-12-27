import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Navbar from './components/Navbar';
import MessageWidget from './components/MessageWidget';
import PostModal from './components/PostModal';

import HomePage from './pages/HomePage';
import FeedPage from './pages/FeedPage';
import RegisterPage from './pages/auth/RegisterPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';

// 🔍 새로 추가된 DM 페이지들
import MessageListPage from './pages/MessageListPage';
import ChatRoomPage from './pages/ChatRoomPage';

function App() {
    const isAuthenticated = !!localStorage.getItem('token');
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);

    return (
        <Router>
            {/* 상단 헤더: 🫧 로고 포함 */}
            {isAuthenticated && <Header />}

            <main style={{
                paddingBottom: isAuthenticated ? '80px' : '0',
                paddingTop: isAuthenticated ? '60px' : '0',
                minHeight: '100vh',
                position: 'relative',
                zIndex: 1
            }}>
                <Routes>
                    {/* 1. 시작 페이지 (소개) */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about" element={<HomePage />} />

                    {/* 2. 인증 관련 */}
                    <Route path="/login" element={isAuthenticated ? <Navigate to="/feed" /> : <LoginPage />} />
                    <Route path="/register" element={isAuthenticated ? <Navigate to="/feed" /> : <RegisterPage />} />

                    {/* 3. 서비스 내부 페이지 */}
                    <Route path="/feed" element={isAuthenticated ? <FeedPage /> : <Navigate to="/login" />} />
                    <Route path="/profile" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />} />

                    {/* 4. 기능 페이지 (DM 고도화) */}
                    <Route path="/search" element={isAuthenticated ? <div style={{padding:'20px'}}>🔎 검색 페이지 준비 중</div> : <Navigate to="/login" />} />

                    {/* 📩 DM 목록 페이지 */}
                    <Route path="/dm" element={isAuthenticated ? <MessageListPage /> : <Navigate to="/login" />} />
                    {/* 💬 개별 채팅방 페이지 */}
                    <Route path="/dm/:roomId" element={isAuthenticated ? <ChatRoomPage /> : <Navigate to="/login" />} />

                    {/* 잘못된 경로는 홈으로 */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>

            {/* ➕ 버튼 클릭 시 열리는 모달 */}
            {isPostModalOpen && <PostModal onClose={() => setIsPostModalOpen(false)} />}

            {isAuthenticated && (
                <>
                    <MessageWidget />
                    {/* 하단 네비바: 6개 아이콘 통합 버전 */}
                    <Navbar setIsPostModalOpen={setIsPostModalOpen} />
                </>
            )}
        </Router>
    );
}

export default App;