import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Swal from 'sweetalert2';

function SettingsPage() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const handleDeleteAccount = async () => {
        const result = await Swal.fire({
            title: '계정을 삭제하시겠습니까?',
            text: "모든 게시글과 대화 내역이 영구히 삭제됩니다.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff6464',
            confirmButtonText: '삭제',
            cancelButtonText: '취소'
        });

        if (result.isConfirmed) {
            try {
                await api.delete('/auth/me');
                localStorage.clear();
                Swal.fire('삭제 완료', '그동안 이용해주셔서 감사합니다.', 'success');
                navigate('/login');
            } catch (err) {
                Swal.fire('오류', '계정 삭제 처리에 실패했습니다.', 'error');
            }
        }
    };

    return (
        <Container>
            <Title>설정</Title>

            <Section>
                <SectionTitle>계정 설정</SectionTitle>
                <MenuCard onClick={() => navigate('/profile/edit')}>
                    <span>프로필 수정</span>
                    <Arrow>〉</Arrow>
                </MenuCard>
                <MenuCard onClick={handleLogout}>
                    <span>로그아웃</span>
                    <Arrow>〉</Arrow>
                </MenuCard>
            </Section>

            <Section>
                <SectionTitle style={{ color: '#ff6464' }}>위험 구역</SectionTitle>
                <DangerCard onClick={handleDeleteAccount}>
                    <span>계정 탈퇴</span>
                    <Desc>버블을 영구히 터뜨립니다.</Desc>
                </DangerCard>
            </Section>

            <VersionText>SafeSky Version 1.0.0</VersionText>
        </Container>
    );
}

export default SettingsPage;

/* --- Styles --- */
const Container = styled.div` max-width: 600px; margin: 40px auto; padding: 0 20px; `;
const Title = styled.h2` color: #1a2a6c; font-weight: 900; margin-bottom: 40px; `;
const Section = styled.div` margin-bottom: 30px; `;
const SectionTitle = styled.h4` font-size: 14px; color: #00BFFF; margin-bottom: 10px; padding-left: 5px; `;
const MenuCard = styled.div`
    background: white; padding: 20px; border-radius: 15px; border: 1px solid #eee;
    display: flex; justify-content: space-between; align-items: center;
    cursor: pointer; margin-bottom: 10px; font-weight: 600; color: #333;
    transition: 0.2s; &:hover { background: #fcfcfc; border-color: #ddd; }
`;
const DangerCard = styled(MenuCard)`
    flex-direction: column; align-items: flex-start; gap: 5px;
    span { color: #ff6464; }
`;
const Desc = styled.span` font-size: 12px; color: #999 !important; font-weight: 400; `;
const Arrow = styled.span` color: #ccc; `;
const VersionText = styled.div` text-align: center; margin-top: 50px; font-size: 12px; color: #ccc; `;