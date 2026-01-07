import React, { useState, useEffect } from 'react';
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

// DM
import MessageListPage from './pages/MessageListPage';
import ChatRoomPage from './pages/ChatRoomPage';

function App() {
    // ✅ token 상태 관리 (로그인/로그아웃 즉시 반영)
    const [isAuthenticated, setIsAuthenticated] = useState(
        !!localStorage.getItem('token')
    );
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);

    useEffect(() => {
        const syncAuth = () => {
            setIsAuthenticated(!!localStorage.getItem('token'));
        };

        window.addEventListener('storage', syncAuth);
        syncAuth();

        return () => window.removeEventListener('storage', syncAuth);
    }, []);

    return (
        <Router>
            {/* 상단 헤더 */}
            {isAuthenticated && <Header />}

            <main
                style={{
                    paddingBottom: isAuthenticated ? '80px' : '0',
                    paddingTop: isAuthenticated ? '60px' : '0',
                    minHeight: '100vh',
                }}
            >
                <Routes>
                    {/* 공개 페이지 */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about" element={<HomePage />} />

                    {/* 인증 */}
                    <Route
                        path="/login"
                        element={isAuthenticated ? <Navigate to="/feed" /> : <LoginPage />}
                    />
                    <Route
                        path="/register"
                        element={isAuthenticated ? <Navigate to="/feed" /> : <RegisterPage />}
                    />

                    {/* 인증 필요 */}
                    <Route
                        path="/feed"
                        element={isAuthenticated ? <FeedPage /> : <Navigate to="/login" />}
                    />
                    <Route
                        path="/profile"
                        element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />}
                    />

                    {/* 검색 */}
                    <Route
                        path="/search"
                        element={
                            isAuthenticated ? (
                                <div style={{ padding: '20px' }}>🔎 검색 페이지 준비 중</div>
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />

                    {/* DM */}
                    <Route
                        path="/dm"
                        element={isAuthenticated ? <MessageListPage /> : <Navigate to="/login" />}
                    />
                    <Route
                        path="/dm/:roomId"
                        element={isAuthenticated ? <ChatRoomPage /> : <Navigate to="/login" />}
                    />

                    {/* fallback */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>

            {/* 게시글 모달 */}
            {isPostModalOpen && <PostModal onClose={() => setIsPostModalOpen(false)} />}

            {/* 하단 UI */}
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
