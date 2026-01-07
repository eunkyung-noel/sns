import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import api from '../api/api';
import Swal from 'sweetalert2';

const ProfilePage = () => {
    const { userId } = useParams(); // URL에서 상대방 ID 추출
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const SERVER_URL = 'http://localhost:5001';

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                // 상대방 ID가 있으면 프로필 조회, 없으면 내 정보 조회
                const endpoint = userId ? `/users/profile/${userId}` : `/auth/me`;
                const res = await api.get(endpoint);
                setProfile(res.data);
            } catch (err) {
                console.error('프로필 로드 실패', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [userId]);

    const handleFollow = async () => {
        try {
            const res = await api.post(`/users/follow/${userId}`);
            // 팔로우 상태 업데이트 로직 (생략)
            Swal.fire('알림', res.data.isFollowing ? '팔로우 성공' : '언팔로우 성공', 'success');
        } catch (err) {
            Swal.fire('오류', '팔로우 처리 중 문제가 발생했습니다.', 'error');
        }
    };

    if (loading) return <EmptyMsg>🫧 로딩 중...</EmptyMsg>;
    if (!profile) return <EmptyMsg>유저를 찾을 수 없습니다.</EmptyMsg>;

    return (
        <Container>
            <ProfileCard>
                <Avatar
                    src={profile.profilePic
                        ? (profile.profilePic.startsWith('http') ? profile.profilePic : `${SERVER_URL}${profile.profilePic}`)
                        : `https://ui-avatars.com/api/?name=${profile.nickname}&background=74b9ff&color=fff`}
                />
                <UserName>@{profile.nickname}</UserName>
                <Bio>{profile.bio || "소개가 없습니다."}</Bio>

                {userId && <FollowBtn onClick={handleFollow}>팔로우</FollowBtn>}

                <StatRow>
                    <StatItem><b>{profile.counts?.posts || 0}</b><br/>게시물</StatItem>
                    <StatItem><b>{profile.counts?.followers || 0}</b><br/>팔로워</StatItem>
                    <StatItem><b>{profile.counts?.following || 0}</b><br/>팔로잉</StatItem>
                </StatRow>
            </ProfileCard>
        </Container>
    );
};

/* Styles */
const Container = styled.div`padding: 40px 20px; max-width: 500px; margin: 0 auto;`;
const ProfileCard = styled.div`background: white; padding: 40px; border-radius: 20px; text-align: center; border: 1px solid #eee;`;
const Avatar = styled.img`width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin-bottom: 15px; border: 2px solid #74b9ff;`;
const UserName = styled.h2`margin: 0; font-size: 24px;`;
const Bio = styled.p`color: #666; margin: 10px 0 20px; font-size: 14px;`;
const FollowBtn = styled.button`background: #007bff; color: white; border: none; padding: 8px 25px; border-radius: 20px; cursor: pointer; font-weight: bold;`;
const StatRow = styled.div`display: flex; justify-content: space-around; border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px;`;
const StatItem = styled.div`font-size: 13px; color: #888; b { color: #000; font-size: 18px; }`;
const EmptyMsg = styled.p`text-align: center; margin-top: 100px; color: #888;`;

export default ProfilePage;