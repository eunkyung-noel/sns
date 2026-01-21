import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// 컴포넌트
import Header from './components/Header';
import Navbar from './components/Navbar';
import MessageWidget from './components/MessageWidget';
import PostModal from './components/PostModal';

// 페이지
import HomePage from './pages/HomePage';
import FeedPage from './pages/FeedPage';
import RegisterPage from './pages/auth/RegisterPage';
import LoginPage from './pages/LoginPage';
import MyPage from './pages/MyPage'; // [수정] ProfilePage 대신 MyPage 사용 시

// DM
import MessageListPage from './pages/MessageListPage';
import ChatRoomPage from './pages/ChatRoomPage';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(
        !!localStorage.getItem('token')
    );
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);

    // [Fact] 인증 상태 동기화 (로그인/로그아웃 시 UI 즉각 반영)
    useEffect(() => {
        const syncAuth = () => {
            setIsAuthenticated(!!localStorage.getItem('token'));
        };

        window.addEventListener('storage', syncAuth);
        window.addEventListener('login-change', syncAuth); // 커스텀 이벤트 대응용
        syncAuth();

        return () => {
            window.removeEventListener('storage', syncAuth);
            window.removeEventListener('login-change', syncAuth);
        };
    }, []);

    return (
        <Router>
            {/* [Fact] 로그인 상태일 때만 헤더 표시 */}
            {isAuthenticated && <Header />}

            <main
                style={{
                    paddingBottom: isAuthenticated ? '80px' : '0',
                    paddingTop: isAuthenticated ? '60px' : '0',
                    minHeight: '100vh',
                    backgroundColor: '#f0f9ff'
                }}
            >
                <Routes>
                    {/* 공개 페이지 */}
                    <Route path="/" element={<HomePage />} />

                    {/* 로그인/회원가입 (로그인 된 상태면 피드로 리다이렉트) */}
                    <Route
                        path="/login"
                        element={isAuthenticated ? <Navigate to="/feed" /> : <LoginPage />}
                    />
                    <Route
                        path="/register"
                        element={isAuthenticated ? <Navigate to="/feed" /> : <RegisterPage />}
                    />

                    {/* 인증 필요 페이지 */}
                    <Route
                        path="/feed"
                        element={isAuthenticated ? <FeedPage /> : <Navigate to="/login" />}
                    />

                    {/* [핵심] 수정 중인 MyPage 연결 */}
                    <Route
                        path="/profile"
                        element={isAuthenticated ? <MyPage /> : <Navigate to="/login" />}
                    />

                    <Route
                        path="/dm"
                        element={isAuthenticated ? <MessageListPage /> : <Navigate to="/login" />}
                    />
                    <Route
                        path="/dm/:roomId"
                        element={isAuthenticated ? <ChatRoomPage /> : <Navigate to="/login" />}
                    />

                    {/* 잘못된 경로 처리 */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>

            {/* 게시글 작성 모달 */}
            {isPostModalOpen && <PostModal onClose={() => setIsPostModalOpen(false)} />}

            {/* 하단 네비게이션 및 위젯 */}
            {isAuthenticated && (
                <>
                    <MessageWidget />
                    <Navbar setIsPostModalOpen={setIsPostModalOpen} />
                </>
            )}
        </Router>
    );
}

export default App;