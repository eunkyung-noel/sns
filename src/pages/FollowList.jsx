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
            <Header>
                <Title>{type === 'followers' ? '팔로워' : '팔로잉'}</Title>
                <CountText>{list.length}명</CountText>
            </Header>
            <List>
                {list.length === 0 ? (
                    <EmptyMsg>목록이 비어 있습니다. 🫧</EmptyMsg>
                ) : (
                    list.map(user => (
                        <UserItem key={user.id}>
                            <UserAvatar src={user.profilePic ? `http://localhost:5001${user.profilePic}` : `https://ui-avatars.com/api/?name=${user.nickname}`} />
                            <UserName>@{user.nickname}</UserName>
                            <FollowBtn>팔로우</FollowBtn>
                        </UserItem>
                    ))
                )}
            </List>
        </Container>
    );
};

export default FollowList;

/* --- 스타일: 기존 디자인을 유지하며 웹 대화면 사이즈 최적화 --- */

const Container = styled.div` 
    max-width: 800px;           /* 🔍 가로 너비 확장 (500px -> 800px) */
    margin: 40px auto;          /* 🔍 상단 여백 추가 */
    background: white;
    border-radius: 25px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
    overflow: hidden;
    min-height: 600px;
`;

const Header = styled.div` 
    padding: 30px; 
    border-bottom: 1px solid #f1f2f6; 
    display: flex;
    justify-content: center;
    align-items: baseline;
    gap: 10px;
`;

const Title = styled.h2`
    margin: 0;
    font-size: 22px;
    color: #1a2a6c;
    font-weight: 800;
`;

const CountText = styled.span`
    font-size: 16px;
    color: #74b9ff;
    font-weight: 600;
`;

const List = styled.div` 
    display: flex; 
    flex-direction: column; 
    padding: 10px 0;
`;

const UserItem = styled.div` 
    display: flex; 
    align-items: center; 
    padding: 20px 40px;         /* 🔍 좌우 패딩 대폭 확대 */
    gap: 20px; 
    transition: background 0.2s;
    cursor: pointer;

    &:hover {
        background: #f8fbff;    /* 웹 전용 호버 효과 */
    }
`;

const UserAvatar = styled.img` 
    width: 60px;                /* 🔍 아바타 크기 확대 (45px -> 60px) */
    height: 60px; 
    border-radius: 50%; 
    object-fit: cover;
    border: 2px solid #f1f2f6;
`;

const UserName = styled.div` 
    flex: 1; 
    font-weight: 600; 
    font-size: 17px;            /* 🔍 닉네임 폰트 확대 */
    color: #2d3436;
`;

const FollowBtn = styled.button` 
    padding: 10px 24px;         /* 🔍 버튼 크기 확대 */
    background: #1a2a6c; 
    color: white; 
    border: none; 
    border-radius: 10px;        /* 🔍 곡률 조정 */
    font-size: 14px; 
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #0984e3;
        transform: translateY(-1px);
    }
`;

const EmptyMsg = styled.div`
    text-align: center;
    padding: 100px 0;
    color: #b2bec3;
    font-size: 16px;
`;