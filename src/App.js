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

import MyPage from './pages/MyPage';
import PostDetailPage from './pages/PostDetailPage';
import ReportListPage from './pages/ReportListPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import MessageListPage from './pages/MessageListPage';
import ChatRoomPage from './pages/ChatRoomPage';
// ✅ 알림 페이지 임포트 추가
import NotificationPage from './pages/NotificationPage';

function App() {
    const isAuthenticated = !!localStorage.getItem('token');
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);

    return (
        <Router>
            {isAuthenticated && <Header />}

            <main style={{
                paddingBottom: isAuthenticated ? '80px' : '0',
                paddingTop: isAuthenticated ? '60px' : '0',
                minHeight: '100vh',
                position: 'relative',
                zIndex: 1
            }}>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about" element={<HomePage />} />

                    <Route path="/login" element={isAuthenticated ? <Navigate to="/feed" /> : <LoginPage />} />
                    <Route path="/register" element={isAuthenticated ? <Navigate to="/feed" /> : <RegisterPage />} />

                    <Route path="/feed" element={isAuthenticated ? <FeedPage /> : <Navigate to="/login" />} />

                    <Route path="/profile" element={isAuthenticated ? <MyPage /> : <Navigate to="/login" />} />
                    <Route path="/mypage" element={isAuthenticated ? <MyPage /> : <Navigate to="/login" />} />

                    {/* ✅ 알림 페이지 라우트 추가 */}
                    <Route path="/notifications" element={isAuthenticated ? <NotificationPage /> : <Navigate to="/login" />} />

                    <Route path="/post/:id" element={isAuthenticated ? <PostDetailPage /> : <Navigate to="/login" />} />

                    <Route path="/mypage/reports" element={isAuthenticated ? <ReportListPage /> : <Navigate to="/login" />} />

                    <Route path="/profile/:userId" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />} />

                    <Route path="/search" element={isAuthenticated ? <SearchPage /> : <Navigate to="/login" />} />
                    <Route path="/dm" element={isAuthenticated ? <MessageListPage /> : <Navigate to="/login" />} />
                    <Route path="/dm/:roomId" element={isAuthenticated ? <ChatRoomPage /> : <Navigate to="/login" />} />

                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>

            {isPostModalOpen && <PostModal onClose={() => setIsPostModalOpen(false)} />}

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