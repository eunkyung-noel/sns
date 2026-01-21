import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

const ReportListPage = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchReports = async () => {
            try {
                setLoading(true);
                // 백엔드 엔드포인트 호출
                const res = await api.get('/posts/reports/my');
                setReports(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("신고 내역 로딩 실패:", err);
                setReports([]);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    if (loading) return <Loading>🫧 신고 내역을 조회 중입니다...</Loading>;

    return (
        <Container>
            <Header>
                <BackBtn onClick={() => navigate(-1)}>〈</BackBtn>
                <TitleCol>
                    <Title>내 신고 내역</Title>
                    <SubTitle>제출하신 신고 내역과 처리 현황을 확인하세요.</SubTitle>
                </TitleCol>
            </Header>

            <ListContainer>
                {reports.length > 0 ? (
                    reports.map((r) => (
                        <ReportCard key={r.id}>
                            <ReportBody>
                                <TagRow>
                                    <ReasonTag>🚨 신고 사유</ReasonTag>
                                    <StatusBadge>처리 중</StatusBadge>
                                </TagRow>
                                <ReasonText>{r.reason}</ReasonText>
                                <DateText>{new Date(r.createdAt).toLocaleString('ko-KR')}</DateText>
                            </ReportBody>
                            <DetailBtn onClick={() => navigate(`/post/${r.postId}`)}>
                                대상 게시글 보기
                            </DetailBtn>
                        </ReportCard>
                    ))
                ) : (
                    <EmptyWrapper>
                        <div className="icon">🫧</div>
                        <p>신고된 기록이 없습니다.</p>
                        <HomeBtn onClick={() => navigate('/feed')}>피드로 돌아가기</HomeBtn>
                    </EmptyWrapper>
                )}
            </ListContainer>
        </Container>
    );
};

/* --- 웹 최적화 스타일 정의 --- */

const Container = styled.div`
    max-width: 900px; /* 🔍 와이드 규격 통일 */
    margin: 40px auto; 
    padding: 0 20px;
    min-height: 100vh;
`;

const Header = styled.div`
    display: flex; 
    align-items: center; 
    gap: 20px; 
    margin-bottom: 40px; 
    padding-bottom: 25px;
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

const ListContainer = styled.div` display: flex; flex-direction: column; gap: 20px; `;

const ReportCard = styled.div`
    background: white;
    padding: 30px;
    border-radius: 25px;
    box-shadow: 0 10px 30px rgba(116, 185, 255, 0.08);
    border: 1px solid #f1f2f6;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: transform 0.2s ease;

    &:hover {
        transform: translateY(-3px);
    }
`;

const ReportBody = styled.div` flex: 1; `;

const TagRow = styled.div` display: flex; align-items: center; gap: 10px; margin-bottom: 12px; `;

const ReasonTag = styled.div`
    font-size: 12px; color: #ff4757; font-weight: 900;
    background: #fff5f5; padding: 4px 10px; border-radius: 8px;
`;

const StatusBadge = styled.div`
    font-size: 11px; color: #f08c00; font-weight: bold;
    background: #fff9db; padding: 4px 10px; border-radius: 8px;
`;

const ReasonText = styled.div`
    font-size: 18px; color: #2d3436; margin-bottom: 10px; font-weight: 700;
`;

const DateText = styled.div` font-size: 13px; color: #b2bec3; `;

const DetailBtn = styled.button`
    background: #f0f7ff; color: #74b9ff; border: 1px solid #e1f0ff;
    padding: 10px 20px; border-radius: 12px; font-weight: bold; cursor: pointer;
    transition: 0.2s;
    &:hover { background: #74b9ff; color: white; }
`;

const Loading = styled.div`
    text-align: center; padding: 150px; font-weight: 900; color: #74b9ff; font-size: 20px;
`;

const EmptyWrapper = styled.div`
    text-align: center; padding: 150px 0;
    .icon { font-size: 60px; margin-bottom: 20px; opacity: 0.5; }
    p { color: #b2bec3; font-size: 18px; font-weight: bold; margin-bottom: 20px; }
`;

const HomeBtn = styled.button`
    background: #74b9ff; color: white; border: none; padding: 12px 30px;
    border-radius: 15px; font-weight: 800; cursor: pointer;
    box-shadow: 0 5px 15px rgba(116, 185, 255, 0.3);
`;

export default ReportListPage;