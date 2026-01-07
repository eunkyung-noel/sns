import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import api from '../api/api';

const FollowList = () => {
    const { userId } = useParams();
    const location = useLocation();
    const type = location.pathname.includes('followers') ? 'followers' : 'following';
    const [list, setList] = useState([]);

    useEffect(() => {
        const fetchList = async () => {
            try {
                const res = await api.get(`/users/${userId}/${type}`);
                setList(res.data);
            } catch (err) {
                console.error("목록 로드 실패");
            }
        };
        fetchList();
    }, [userId, type]);

    return (
        <Container>
            <Header>{type === 'followers' ? '팔로워' : '팔로잉'}</Header>
            <List>
                {list.map(user => (
                    <UserItem key={user.id}>
                        <UserAvatar src={user.profilePic ? `http://localhost:5001${user.profilePic}` : `https://ui-avatars.com/api/?name=${user.nickname}`} />
                        <UserName>@{user.nickname}</UserName>
                        <FollowBtn>팔로우</FollowBtn>
                    </UserItem>
                ))}
            </List>
        </Container>
    );
};

export default FollowList;

const Container = styled.div` max-width: 500px; margin: 0 auto; `;
const Header = styled.div` padding: 20px; font-weight: bold; border-bottom: 1px solid #eee; text-align: center; `;
const List = styled.div` display: flex; flex-direction: column; `;
const UserItem = styled.div` display: flex; align-items: center; padding: 15px 20px; gap: 15px; `;
const UserAvatar = styled.img` width: 45px; height: 45px; border-radius: 50%; `;
const UserName = styled.div` flex: 1; font-weight: 500; `;
const FollowBtn = styled.button` padding: 5px 12px; background: #1a2a6c; color: white; border: none; border-radius: 5px; font-size: 12px; `;