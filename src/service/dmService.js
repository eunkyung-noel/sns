import React, { useEffect, useState, useRef } from 'react';
import api from '../api/api'; // axios 인스턴스 사용

const ChatWindow = ({ roomId, currentUserId }) => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [partnerName, setPartnerName] = useState('');
    const scrollRef = useRef();

    // 1. 메시지 및 상대방 정보 로드
    useEffect(() => {
        const fetchChatData = async () => {
            try {
                // api.js의 baseURL이 /api이므로 경로 주의
                const response = await api.get(`/dm/detail/${roomId}`);
                // 백엔드 응답 구조: { partnerName: '...', messages: [...] }
                setMessages(response.data.messages || []);
                setPartnerName(response.data.partnerName);
            } catch (error) {
                console.error("데이터 로드 실패:", error);
            }
        };

        if (roomId) fetchChatData();
    }, [roomId]);

    // 2. 스크롤 하단 고정
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 3. 메시지 전송 (POST 요청)
    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const newMessageData = {
            receiverId: roomId, // 스키마에 따라 상대방 ID 전송
            content: inputText
        };

        try {
            // 백엔드 sendDM 컨트롤러로 전송
            const res = await api.post('/dm/send', newMessageData);

            // UI 업데이트 (백엔드에서 생성된 메시지 객체 추가)
            setMessages((prev) => [...prev, res.data]);
            setInputText('');
        } catch (error) {
            console.error("전송 실패:", error);
        }
    };

    return (
        <div className="flex flex-col h-full border rounded-lg bg-white shadow-sm">
            <div className="p-4 border-b font-bold bg-gray-50">
                대화 상대: {partnerName || roomId}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} // Prisma 스키마의 id 사용
                         className={`flex ${String(msg.senderId) === String(currentUserId) ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-3 rounded-lg ${
                            String(msg.senderId) === String(currentUserId)
                                ? 'bg-blue-500 text-white rounded-br-none'
                                : 'bg-gray-200 text-black rounded-bl-none'
                        }`}>
                            <p className="text-sm">{msg.content}</p>
                            <span className="text-[10px] opacity-70 block mt-1">
                                {new Date(msg.createdAt).toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="메시지를 입력하세요..."
                    className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md">전송</button>
            </form>
        </div>
    );
};

export default ChatWindow;