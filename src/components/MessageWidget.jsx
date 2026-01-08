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
    const [errorMsg, setErrorMsg] = useState('');

    const myId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

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

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        const partnerId = activePartner?.id || activePartner?._id;
        if (!newMessage.trim() || !partnerId) return;

        try {
            setErrorMsg('');
            const res = await api.post(`/dm/${partnerId}`, { content: newMessage });
            setMessages(prev => [...prev, res.data]);
            setNewMessage('');
        } catch (err) {
            if (err.response?.status === 403) {
                setErrorMsg(err.response.data.message);
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
                            <HeaderInfo>
                                <BackBtn onClick={() => {setActivePartner(null); setMessages([]); setErrorMsg('');}}>←</BackBtn>
                                <span className="nickname">{activePartner.nickname}</span>
                            </HeaderInfo>
                        ) : (
                            <span>메시지 검색 🫧</span>
                        )}
                        <CloseBtn onClick={() => setIsOpen(false)}>×</CloseBtn>
                    </PopupHeader>

                    {activePartner ? (
                        <ChatArea>
                            {errorMsg && <InnerErrorBar>⚠️ {errorMsg}</InnerErrorBar>}
                            <MessageArea>
                                {messages.map((msg, i) => (
                                    <Bubble key={i} $isMe={String(msg.senderId || msg.sender) === String(myId)}>
                                        {msg.content}
                                    </Bubble>
                                ))}
                            </MessageArea>
                            <InputRow onSubmit={handleSend}>
                                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="메시지를 입력하세요..." />
                                <SendBtn type="submit" disabled={!newMessage.trim()}>➤</SendBtn>
                            </InputRow>
                        </ChatArea>
                    ) : (
                        <SearchContainer>
                            <SearchInput
                                placeholder="대화하고 싶은 유저의 이름/이메일..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <ResultList>
                                {searchResults.map((user) => (
                                    <UserItem key={user.id} onClick={() => setActivePartner(user)}>
                                        <div className="avatar">{user.isAdult ? '🐳' : '🐠'}</div>
                                        <div className="info">
                                            <div className="name">{user.nickname}</div>
                                            <div className="email">{user.email}</div>
                                        </div>
                                    </UserItem>
                                ))}
                            </ResultList>
                        </SearchContainer>
                    )}
                </ChatPopup>
            )}
            <MainBtn onClick={() => setIsOpen(!isOpen)}>{isOpen ? '×' : '🫧'}</MainBtn>
        </WidgetRoot>
    );
};

export default MessageWidget;

/* --- 웹 최적화 스타일 --- */

const slideDown = keyframes`
    from { transform: translateY(-100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
`;

const WidgetRoot = styled.div`
    position: fixed;
    bottom: 30px; /* 🔍 웹 환경에 맞게 여백 조정 */
    right: 30px;
    z-index: 9999;
`;

const MainBtn = styled.div`
    width: 65px;
    height: 65px;
    background: #ffffff;
    border-radius: 50%;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    cursor: pointer;
    border: 1px solid #e1e1e1;
    transition: all 0.3s ease;
    &:hover { transform: scale(1.05); box-shadow: 0 12px 30px rgba(0,0,0,0.2); }
`;

const ChatPopup = styled.div`
    position: absolute;
    bottom: 80px;
    right: 0;
    width: 360px; /*  너비를 300 -> 360으로 확장 */
    height: 550px; /*  높이를 480 -> 550으로 확장 */
    background: white;
    border-radius: 24px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.15);
    border: 1px solid #f0f0f0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

const PopupHeader = styled.div`
    background: #ffffff;
    color: #333;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #f0f0f0;
    font-weight: 600;
`;

const HeaderInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    .nickname { font-size: 16px; color: #1a1a1a; }
`;

const BackBtn = styled.span` cursor: pointer; font-size: 20px; color: #999; &:hover { color: #333; } `;
const CloseBtn = styled.span` cursor: pointer; font-size: 24px; color: #999; &:hover { color: #333; } `;

const ChatArea = styled.div` display: flex; flex-direction: column; flex: 1; position: relative; `;

const InnerErrorBar = styled.div`
    position: absolute; top: 0; left: 0; right: 0;
    background: #fff5f5; color: #ff4757;
    padding: 10px; font-size: 12px; text-align: center;
    z-index: 10; animation: ${slideDown} 0.3s ease-out;
    border-bottom: 1px solid #ffe3e3;
`;

const MessageArea = styled.div`
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: #fcfcfc;
`;

const Bubble = styled.div`
    max-width: 75%;
    padding: 10px 14px;
    border-radius: 18px;
    font-size: 14px;
    line-height: 1.4;
    align-self: ${p => p.$isMe ? 'flex-end' : 'flex-start'};
    background: ${p => p.$isMe ? '#74b9ff' : '#ffffff'};
    color: ${p => p.$isMe ? 'white' : '#333'};
    box-shadow: 0 2px 4px rgba(0,0,0,0.03);
    border: ${p => p.$isMe ? 'none' : '1px solid #eee'};
`;

const InputRow = styled.form`
    display: flex;
    padding: 15px 20px;
    background: white;
    border-top: 1px solid #f0f0f0;
    align-items: center;
`;

const Input = styled.input`
    flex: 1;
    border: none;
    outline: none;
    padding: 8px;
    font-size: 14px;
`;

const SendBtn = styled.button`
    background: none;
    border: none;
    color: ${p => p.disabled ? '#ccc' : '#74b9ff'};
    cursor: pointer;
    font-size: 22px;
    padding-left: 10px;
`;

const SearchContainer = styled.div` padding: 20px; display: flex; flex-direction: column; height: 100%; `;
const SearchInput = styled.input`
    width: 100%;
    padding: 12px 15px;
    border-radius: 12px;
    border: 1px solid #eee;
    background: #f8f9fa;
    margin-bottom: 15px;
    outline: none;
    &:focus { border-color: #74b9ff; }
`;

const ResultList = styled.div` flex: 1; overflow-y: auto; `;
const UserItem = styled.div`
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 12px;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.2s;
    &:hover { background: #f8f9fa; }
    .avatar { font-size: 24px; }
    .info { display: flex; flex-direction: column; }
    .name { font-weight: 600; font-size: 14px; color: #333; }
    .email { font-size: 12px; color: #999; }
`;