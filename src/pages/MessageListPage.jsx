import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../api/api';

const MessageListPage = () => {
    const [rooms, setRooms] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/dm/rooms').then(res => setRooms(res.data)).catch(console.error);
    }, []);

    const handleSearch = async (e) => {
        setSearchTerm(e.target.value);
        if (e.target.value.trim()) {
            const res = await api.get(`/dm/search?term=${e.target.value}`);
            setSearchResults(res.data);
        } else setSearchResults([]);
    };

    return (
        <Container>
            <Header>🫧 메시지 비눗방울</Header>
            <SearchBox>
                <Input placeholder="검색..." value={searchTerm} onChange={handleSearch} />
                {searchResults.length > 0 && (
                    <Dropdown>
                        {searchResults.map(u => (
                            <Item key={u._id} onClick={() => navigate(`/dm/${u._id}`)}>
                                {u.name} (@{u.username})
                            </Item>
                        ))}
                    </Dropdown>
                )}
            </SearchBox>
            <List>
                {rooms.map(r => (
                    <Card key={r.partnerId} onClick={() => navigate(`/dm/${r.partnerId}`)}>
                        <Name>{r.partnerName}</Name>
                        <Last>{r.lastMessage}</Last>
                        {r.unreadCount > 0 && <Badge>{r.unreadCount}</Badge>}
                    </Card>
                ))}
            </List>
        </Container>
    );
};

export default MessageListPage;

const Container = styled.div` max-width: 500px; margin: auto; padding: 20px; `;
const Header = styled.h1` text-align: center; color: #74b9ff; `;
const SearchBox = styled.div` position: relative; margin-bottom: 20px; `;
const Input = styled.input` width: 100%; padding: 12px; border-radius: 20px; border: 1px solid #ddd; outline: none; `;
const Dropdown = styled.div` position: absolute; top: 50px; width: 100%; background: white; border: 1px solid #eee; z-index: 10; box-shadow: 0 4px 10px rgba(0,0,0,0.1); `;
const Item = styled.div` padding: 10px; cursor: pointer; &:hover { background: #f0f7ff; } `;
const List = styled.div` display: flex; flex-direction: column; gap: 10px; `;
const Card = styled.div` background: white; padding: 15px; border-radius: 12px; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.05); `;
const Name = styled.div` font-weight: bold; `;
const Last = styled.div` font-size: 13px; color: #666; margin-top: 5px; `;
const Badge = styled.span` background: #000080; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; float: right; `;