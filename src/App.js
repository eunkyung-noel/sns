import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Navbar from './components/Navbar';
import MessageWidget from './components/MessageWidget';
import PostModal from './components/PostModal';

// 페이지 컴포넌트 임포트
import HomePage from './pages/HomePage';
import FeedPage from './pages/FeedPage';
import RegisterPage from './pages/auth/RegisterPage';
import LoginPage from './pages/LoginPage';
import FindPasswordPage from './pages/FindPasswordPage';
import MyPage from './pages/MyPage';
import PostDetailPage from './pages/PostDetailPage';
import ReportListPage from './pages/ReportListPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import MessageListPage from './pages/MessageListPage';
import ChatRoomPage from './pages/ChatRoomPage';
import NotificationsPage from './pages/NotificationsPage';
import AboutPage from './pages/AboutPage';

function App() {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);

    useEffect(() => {
        const handleStorageChange = () => setToken(localStorage.getItem('token'));
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const isAuthenticated = !!token;

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
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/login" element={isAuthenticated ? <Navigate to="/feed" /> : <LoginPage />} />
                    <Route path="/register" element={isAuthenticated ? <Navigate to="/feed" /> : <RegisterPage />} />
                    <Route path="/find-password" element={<FindPasswordPage />} />
                    <Route path="/feed" element={isAuthenticated ? <FeedPage /> : <Navigate to="/login" />} />
                    <Route path="/profile" element={isAuthenticated ? <MyPage /> : <Navigate to="/login" />} />
                    <Route path="/mypage" element={isAuthenticated ? <MyPage /> : <Navigate to="/login" />} />
                    <Route path="/notifications" element={isAuthenticated ? <NotificationsPage /> : <Navigate to="/login" />} />
                    <Route path="/post/:id" element={isAuthenticated ? <PostDetailPage /> : <Navigate to="/login" />} />
                    <Route path="/mypage/reports" element={isAuthenticated ? <ReportListPage /> : <Navigate to="/login" />} />
                    <Route path="/profile/:userId" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />} />
                    <Route path="/search" element={isAuthenticated ? <SearchPage /> : <Navigate to="/login" />} />
                    <Route path="/dm" element={isAuthenticated ? <MessageListPage /> : <Navigate to="/login" />} />
                    <Route path="/dm/:roomId" element={isAuthenticated ? <ChatRoomPage /> : <Navigate to="/login" />} />
                    {/* [교정] 프로필에서 유저 ID를 들고 올 때 튕기지 않도록 경로 추가 */}
                    <Route path="/chat/:userId" element={isAuthenticated ? <ChatRoomPage /> : <Navigate to="/login" />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>

            {isPostModalOpen && (
                <PostModal
                    onClose={() => setIsPostModalOpen(false)}
                    onSuccess={() => window.location.reload()}
                />
            )}

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