import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components'; // keyframes 추가
import api from '../api/api';
import Swal from 'sweetalert2';

const MessageWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [activePartner, setActivePartner] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    const myId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token || !searchTerm.trim()) {
            setSearchResults([]);
            return;
        }
        const searchUser = async () => {
            try {
                const res = await api.get(`/api/users/search?query=${searchTerm}`);
                setSearchResults(res.data);
            } catch (err) { console.error("검색 실패", err); }
        };
        const timer = setTimeout(searchUser, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, token]);

    useEffect(() => {
        if (!token || !isOpen || !activePartner) return;
        const fetchMessages = async () => {
            try {
                const res = await api.get(`/api/dm/${activePartner._id}`);
                setMessages(res.data);
            } catch (err) { console.error("메시지 로드 실패", err); }
        };
        fetchMessages();
        const interval = setInterval(fetchMessages, 4000);
        return () => clearInterval(interval);
    }, [isOpen, activePartner, token]);

    const handleToggle = () => {
        if (!token) {
            Swal.fire('알림', '로그인 후 메시지를 이용할 수 있습니다. 🫧', 'info');
            return;
        }
        setIsOpen(!isOpen);
    };

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() || !activePartner || !token) return;
        try {
            await api.post(`/api/dm/send`, { receiverId: activePartner._id, content: newMessage });
            setNewMessage('');
        } catch (err) { console.error("전송 실패", err); }
    };

    return (
        <WidgetRoot>
            {isOpen && token && (
                <ChatPopup>
                    <PopupHeader>
                        {activePartner ? (
                            <>
                                <BackBtn onClick={() => {setActivePartner(null); setMessages([]);}}>←</BackBtn>
                                <span>{activePartner.name}</span>
                            </>
                        ) : (
                            <span>유저 검색 🫧</span>
                        )}
                        <CloseBtn onClick={() => setIsOpen(false)}>×</CloseBtn>
                    </PopupHeader>

                    {!activePartner ? (
                        <SearchArea>
                            <SearchInput
                                placeholder="검색하여 대화 시작..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <ResultList>
                                {searchResults.map(user => (
                                    <UserItem key={user._id} onClick={() => setActivePartner(user)}>
                                        <Avatar>{user.name ? user.name[0] : '?'}</Avatar>
                                        <div>{user.name} (@{user.id || user.username})</div>
                                    </UserItem>
                                ))}
                            </ResultList>
                        </SearchArea>
                    ) : (
                        <>
                            <MessageArea>
                                {messages.map((msg, i) => (
                                    <Bubble key={i} $isMe={String(msg.sender) === String(myId)}>
                                        {msg.content}
                                    </Bubble>
                                ))}
                            </MessageArea>
                            <InputRow onSubmit={handleSend}>
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="메시지..."
                                />
                                <SendBtn type="submit">➤</SendBtn>
                            </InputRow>
                        </>
                    )}
                </ChatPopup>
            )}

            <MainBubble onClick={handleToggle}>
                {isOpen && token ? '❌' : '🫧'}
            </MainBubble>
        </WidgetRoot>
    );
};

export default MessageWidget;

/* --- 애니메이션 정의 --- */

// 버블이 위아래로 둥둥 뜨는 효과
const float = keyframes`
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
`;

// 팝업이 나타날 때 부드럽게 올라오는 효과
const popUp = keyframes`
    from { opacity: 0; transform: translateY(20px) scale(0.9); }
    to { opacity: 1; transform: translateY(0) scale(1); }
`;

/* --- 스타일 --- */

const WidgetRoot = styled.div`
    position: fixed !important;
    bottom: 110px;
    right: 25px;
    z-index: 999999 !important;
`;

const MainBubble = styled.div`
    width: 65px; height: 65px; background: white; border-radius: 50%;
    box-shadow: 0 8px 30px rgba(116, 185, 255, 0.6);
    display: flex; align-items: center; justify-content: center;
    font-size: 32px; cursor: pointer; border: 2px solid #74b9ff;
    
    /* 두둥실 애니메이션 적용 */
    animation: ${float} 3s ease-in-out infinite;
    transition: all 0.2s ease-in-out;

    &:hover { 
        transform: scale(1.1); 
        animation-play-state: paused; /* 호버 시에는 멈춤 */
    }
`;

const ChatPopup = styled.div`
    position: absolute; bottom: 85px; right: 0; width: 320px; height: 460px;
    background: white; border-radius: 25px; display: flex; flex-direction: column;
    box-shadow: 0 15px 50px rgba(0,0,0,0.2); border: 1px solid #e1f0ff; overflow: hidden;
    
    /* 팝업 애니메이션 */
    animation: ${popUp} 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
`;

const PopupHeader = styled.div` background: #74b9ff; color: white; padding: 15px; display: flex; justify-content: space-between; align-items: center; font-weight: bold; `;
const BackBtn = styled.span` cursor: pointer; font-size: 20px; `;
const CloseBtn = styled.span` cursor: pointer; font-size: 20px; `;
const SearchArea = styled.div` flex: 1; padding: 15px; display: flex; flex-direction: column; `;
const SearchInput = styled.input` padding: 10px; border-radius: 12px; border: 1px solid #eee; outline: none; margin-bottom: 10px; `;
const ResultList = styled.div` flex: 1; overflow-y: auto; `;
const UserItem = styled.div` display: flex; align-items: center; gap: 10px; padding: 8px; cursor: pointer; border-radius: 10px; &:hover { background: #f0f7ff; } `;
const Avatar = styled.div` width: 30px; height: 30px; background: #74b9ff; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; `;
const MessageArea = styled.div` flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; background: #fbfdff; `;
const Bubble = styled.div` max-width: 80%; padding: 8px 12px; border-radius: 15px; font-size: 13px; align-self: ${props => props.$isMe ? 'flex-end' : 'flex-start'}; background: ${props => props.$isMe ? '#74b9ff' : '#eee'}; color: ${props => props.$isMe ? 'white' : '#333'}; `;
const InputRow = styled.form` display: flex; padding: 12px; border-top: 1px solid #eee; `;
const Input = styled.input` flex: 1; border: none; outline: none; font-size: 14px; `;
const SendBtn = styled.button` background: none; border: none; color: #74b9ff; cursor: pointer; font-size: 20px; `;