import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import api from '../api/api';

const MessageWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [activePartner, setActivePartner] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [errorMsg, setErrorMsg] = useState(''); // 에러 메시지 상태 추가

    const myId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    // 유저 검색
    useEffect(() => {
        if (!token || !searchTerm.trim()) {
            setSearchResults([]);
            return;
        }
        const searchUser = async () => {
            try {
                const res = await api.get(`/dm/search?term=${encodeURIComponent(searchTerm)}`);
                setSearchResults(Array.isArray(res.data) ? res.data : []);
            } catch (err) { console.error("검색 실패", err); }
        };
        const timer = setTimeout(searchUser, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, token]);

    // 메시지 로드
    useEffect(() => {
        const partnerId = activePartner?.id || activePartner?._id;
        if (!token || !isOpen || !partnerId) return;

        const fetchMessages = async () => {
            try {
                const res = await api.get(`/dm/${partnerId}`);
                setMessages(res.data);
            } catch (err) { console.error("로드 실패", err); }
        };
        fetchMessages();
        const interval = setInterval(fetchMessages, 4000);
        return () => clearInterval(interval);
    }, [isOpen, activePartner, token]);

    // 메시지 전송
    const handleSend = async (e) => {
        if (e) e.preventDefault();
        const partnerId = activePartner?.id || activePartner?._id;
        if (!newMessage.trim() || !partnerId) return;

        try {
            setErrorMsg(''); // 전송 시도 시 기존 에러 제거
            const res = await api.post(`/dm/${partnerId}`, { content: newMessage });
            setMessages(prev => [...prev, res.data]);
            setNewMessage('');
        } catch (err) {
            if (err.response?.status === 403) {
                // 백엔드에서 보낸 "맞팔로우 시에만 가능합니다" 등의 메시지 표시
                setErrorMsg(err.response.data.message);
                // 5초 후 자동으로 에러 메시지 숨김
                setTimeout(() => setErrorMsg(''), 5000);
            } else {
                console.error("전송 에러", err);
            }
        }
    };

    return (
        <WidgetRoot>
            {isOpen && token && (
                <ChatPopup>
                    <PopupHeader>
                        {activePartner ? (
                            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                <span style={{cursor:'pointer'}} onClick={() => {setActivePartner(null); setMessages([]); setErrorMsg('');}}>←</span>
                                <span>{activePartner.nickname}</span>
                            </div>
                        ) : (
                            <span>유저 검색 🫧</span>
                        )}
                        <span style={{cursor:'pointer'}} onClick={() => setIsOpen(false)}>×</span>
                    </PopupHeader>

                    {activePartner ? (
                        <ChatArea>
                            {/* 내부 에러 공지 바 */}
                            {errorMsg && (
                                <InnerErrorBar>
                                    ⚠️ {errorMsg}
                                </InnerErrorBar>
                            )}

                            <MessageArea>
                                {messages.map((msg, i) => (
                                    <Bubble key={i} $isMe={String(msg.senderId || msg.sender) === String(myId)}>
                                        {msg.content}
                                    </Bubble>
                                ))}
                            </MessageArea>
                            <InputRow onSubmit={handleSend}>
                                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="메시지..." />
                                <SendBtn type="submit">➤</SendBtn>
                            </InputRow>
                        </ChatArea>
                    ) : (
                        <SearchContainer>
                            <SearchInput
                                placeholder="이름/이메일 입력..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <ResultList>
                                {searchResults.map((user) => (
                                    <UserItem key={user.id} onClick={() => setActivePartner(user)}>
                                        <div style={{fontSize:'20px'}}>{user.isAdult ? '🐳' : '🐠'}</div>
                                        <div>
                                            <div style={{fontWeight:'bold', fontSize:'14px'}}>{user.nickname}</div>
                                            <div style={{fontSize:'11px', color:'#999'}}>{user.email}</div>
                                        </div>
                                    </UserItem>
                                ))}
                            </ResultList>
                        </SearchContainer>
                    )}
                </ChatPopup>
            )}
            <MainBtn onClick={() => setIsOpen(!isOpen)}>{isOpen ? '❌' : '🫧'}</MainBtn>
        </WidgetRoot>
    );
};

export default MessageWidget;

/* --- 스타일 수정 및 추가 --- */

const slideDown = keyframes`
    from { transform: translateY(-100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
`;

const WidgetRoot = styled.div` position: fixed; bottom: 110px; right: 25px; z-index: 9999; `;
const MainBtn = styled.div` width: 60px; height: 60px; background: white; border-radius: 50%; box-shadow: 0 4px 15px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; font-size: 30px; cursor: pointer; border: 2px solid #74b9ff; `;
const ChatPopup = styled.div` position: absolute; bottom: 70px; right: 0; width: 300px; height: 480px; background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); border: 1px solid #eee; display: flex; flex-direction: column; overflow: hidden; `;
const PopupHeader = styled.div` background: #74b9ff; color: white; padding: 15px; display: flex; justify-content: space-between; font-weight: bold; `;
const ChatArea = styled.div` display: flex; flex-direction: column; height: 420px; position: relative; `;

// 채팅창 내부 상단 에러 바 스타일
const InnerErrorBar = styled.div`
    position: absolute; top: 0; left: 0; right: 0;
    background: #ff4757; color: white;
    padding: 8px 12px; font-size: 11px; text-align: center;
    z-index: 10; animation: ${slideDown} 0.3s ease-out;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
`;

const MessageArea = styled.div` flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; background: #fafafa; `;
const Bubble = styled.div` max-width: 80%; padding: 8px 12px; border-radius: 15px; font-size: 13px; align-self: ${p => p.$isMe ? 'flex-end' : 'flex-start'}; background: ${p => p.$isMe ? '#74b9ff' : '#eee'}; color: ${p => p.$isMe ? 'white' : 'black'}; `;
const InputRow = styled.form` display: flex; padding: 10px; border-top: 1px solid #eee; `;
const Input = styled.input` flex: 1; border: none; outline: none; padding: 5px; `;
const SendBtn = styled.button` background: none; border: none; color: #74b9ff; cursor: pointer; font-size: 20px; `;
const SearchContainer = styled.div` padding: 10px; display: flex; flex-direction: column; height: 100%; `;
const SearchInput = styled.input` width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #ddd; margin-bottom: 10px; `;
const ResultList = styled.div` flex: 1; overflow-y: auto; `;
const UserItem = styled.div` display: flex; align-items: center; gap: 10px; padding: 10px; border-bottom: 1px solid #eee; cursor: pointer; `;