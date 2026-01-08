import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
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
            text: "모든 게시물과 데이터가 영구히 삭제되며 복구할 수 없습니다.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff7675',
            confirmButtonText: '탈퇴하기',
            cancelButtonText: '취소',
            background: '#ffffff',
            borderRadius: '20px'
        });

        if (result.isConfirmed) {
            try {
                await api.delete('/auth/me');
                localStorage.clear();
                Swal.fire('삭제 완료', '그동안 버블을 이용해주셔서 감사합니다.', 'success');
                navigate('/login');
            } catch (err) {
                Swal.fire('오류', '계정 삭제 처리에 실패했습니다.', 'error');
            }
        }
    };

    return (
        <Container>
            <Header>
                <BackBtn onClick={() => navigate(-1)}>〈</BackBtn>
                <TitleCol>
                    <Title>설정</Title>
                    <SubTitle>내 계정 정보와 서비스 환경을 관리합니다.</SubTitle>
                </TitleCol>
            </Header>

            <ContentGrid>
                <Section>
                    <SectionTitle>일반 설정</SectionTitle>
                    <MenuCard onClick={() => navigate('/profile/edit')}>
                        <MenuInfo>
                            <Icon>👤</Icon>
                            <div className="text-box">
                                <span className="label">프로필 수정</span>
                                <span className="desc">닉네임, 프로필 사진, 소개글을 변경합니다.</span>
                            </div>
                        </MenuInfo>
                        <Arrow>〉</Arrow>
                    </MenuCard>

                    <MenuCard onClick={handleLogout}>
                        <MenuInfo>
                            <Icon>🚪</Icon>
                            <div className="text-box">
                                <span className="label">로그아웃</span>
                                <span className="desc">현재 기기에서 안전하게 로그아웃합니다.</span>
                            </div>
                        </MenuInfo>
                        <Arrow>〉</Arrow>
                    </MenuCard>
                </Section>

                <Section>
                    <SectionTitle style={{ color: '#ff7675' }}>계정 관리</SectionTitle>
                    <DangerCard onClick={handleDeleteAccount}>
                        <MenuInfo>
                            <Icon>⚠️</Icon>
                            <div className="text-box">
                                <span className="label">계정 탈퇴</span>
                                <span className="desc">버블을 영구히 터뜨리고 모든 데이터를 삭제합니다.</span>
                            </div>
                        </MenuInfo>
                        <Arrow>〉</Arrow>
                    </DangerCard>
                </Section>
            </ContentGrid>

            <Footer>
                <VersionText>SafeSky Version 1.0.0 (Global)</VersionText>
                <Copyright>© 2026 Bubble. All rights reserved.</Copyright>
            </Footer>
        </Container>
    );
}

/* --- 스타일 정의: 와이드 웹 최적화 --- */

const Container = styled.div`
    max-width: 900px;
    margin: 40px auto;
    padding: 0 20px;
    min-height: 100vh;
`;

const Header = styled.div`
    display: flex; align-items: center; gap: 20px; 
    margin-bottom: 40px; padding-bottom: 25px;
    border-bottom: 2px solid #f0f7ff;
`;

const BackBtn = styled.button`
    background: #f1f2f6; border: none; width: 45px; height: 45px; 
    border-radius: 50%; font-size: 20px; cursor: pointer; color: #74b9ff;
    display: flex; align-items: center; justify-content: center;
    transition: 0.2s;
    &:hover { background: #74b9ff; color: white; }
`;

const TitleCol = styled.div` display: flex; flex-direction: column; gap: 4px; `;
const Title = styled.h2` margin: 0; font-size: 26px; font-weight: 900; color: #2d3436; `;
const SubTitle = styled.span` font-size: 14px; color: #b2bec3; `;

const ContentGrid = styled.div`
    display: flex;
    flex-direction: column;
    gap: 40px;
`;

const Section = styled.div` display: flex; flex-direction: column; gap: 12px; `;

const SectionTitle = styled.h4` 
    font-size: 14px; color: #74b9ff; font-weight: 900; 
    margin: 0 0 5px 5px; text-transform: uppercase; letter-spacing: 1px;
`;

const MenuCard = styled.div`
    background: white; 
    padding: 25px 30px; 
    border-radius: 20px; 
    border: 1px solid #f1f2f6;
    display: flex; justify-content: space-between; align-items: center;
    cursor: pointer; 
    transition: all 0.2s;
    box-shadow: 0 4px 15px rgba(116, 185, 255, 0.05);

    &:hover { 
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(116, 185, 255, 0.1);
        border-color: #e1f0ff;
    }
`;

const MenuInfo = styled.div`
    display: flex; align-items: center; gap: 20px;
    .text-box { display: flex; flex-direction: column; gap: 4px; }
    .label { font-size: 17px; font-weight: 800; color: #2d3436; }
    .desc { font-size: 13px; color: #b2bec3; }
`;

const Icon = styled.div`
    width: 45px; height: 45px; background: #f8fbff;
    border-radius: 12px; display: flex; align-items: center; justify-content: center;
    font-size: 20px;
`;

const DangerCard = styled(MenuCard)`
    &:hover { border-color: #ff7675; }
    .label { color: #ff7675; }
    ${Icon} { background: #fff5f5; }
`;

const Arrow = styled.span` color: #dfe6e9; font-weight: bold; `;

const Footer = styled.div`
    margin-top: 80px;
    padding-top: 30px;
    border-top: 1px solid #f1f2f6;
    text-align: center;
    display: flex; flex-direction: column; gap: 8px;
`;

const VersionText = styled.div` font-size: 13px; color: #b2bec3; font-weight: 600; `;
const Copyright = styled.div` font-size: 12px; color: #dfe6e9; `;

export default SettingsPage;