import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

const MyReportPage = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await api.get('/posts/reports/my');
            setReports(res.data);
        } catch (err) {
            console.error("신고 내역 로드 실패:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    if (loading) return <Loading>🫧 신고 내역을 불러오는 중...</Loading>;

    return (
        <Container>
            <Header>
                <BackButton onClick={() => navigate(-1)}>〈</BackButton>
                <TitleCol>
                    <Title>내 신고 내역</Title>
                    <SubTitle>제출하신 소중한 의견의 처리 현황을 확인하세요.</SubTitle>
                </TitleCol>
            </Header>

            {reports.length > 0 ? (
                <ReportList>
                    {reports.map((report) => (
                        <ReportCard key={report.id}>
                            <ReportHeader>
                                <Badge type={report.type}>
                                    {report.type === 'POST' ? '📄 게시글 신고' : '💬 댓글 신고'}
                                </Badge>
                                <Status status={report.status}>
                                    {report.status === 'PENDING' ? '⏳ 처리 대기중' : '✅ 처리 완료'}
                                </Status>
                            </ReportHeader>

                            <ReasonSection>
                                <ReasonLabel>신고 사유</ReasonLabel>
                                <ReasonText>{report.reason}</ReasonText>
                            </ReasonSection>

                            <TargetBox>
                                <TargetLabel>신고된 원문 내용</TargetLabel>
                                <div className="content-row">
                                    <TargetContent>
                                        {report.type === 'POST'
                                            ? (report.post?.content || "내용이 존재하지 않습니다.")
                                            : (report.comment?.content || "내용이 존재하지 않습니다.")}
                                    </TargetContent>
                                    {report.type === 'POST' && report.post?.imageUrl && (
                                        <PostThumbnail src={`${SERVER_URL}${report.post.imageUrl}`} alt="post" />
                                    )}
                                </div>
                            </TargetBox>

                            <ReportFooter>
                                <UserInfo>대상 사용자: <b>@{report.target?.nickname || '알 수 없음'}</b></UserInfo>
                                <DateText>{new Date(report.createdAt).toLocaleDateString()} 제출됨</DateText>
                            </ReportFooter>
                        </ReportCard>
                    ))}
                </ReportList>
            ) : (
                <EmptySection>
                    <div className="icon">🚫</div>
                    <p>신고하신 기록이 없습니다.</p>
                    <span onClick={() => navigate('/')}>메인으로 돌아가기</span>
                </EmptySection>
            )}
        </Container>
    );
};

/* --- 스타일 정의: 와이드 웹 최적화 --- */

const Container = styled.div`
    max-width: 900px;           /* 🔍 마이페이지와 동일한 900px */
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

const BackButton = styled.button`
    background: #f1f2f6; border: none; width: 45px; height: 45px; 
    border-radius: 50%; font-size: 20px; cursor: pointer; color: #74b9ff;
    display: flex; align-items: center; justify-content: center;
    transition: 0.2s;
    &:hover { background: #74b9ff; color: white; }
`;

const TitleCol = styled.div` display: flex; flex-direction: column; gap: 4px; `;
const Title = styled.h2` margin: 0; font-size: 26px; font-weight: 900; color: #2d3436; `;
const SubTitle = styled.span` font-size: 14px; color: #b2bec3; `;

const ReportList = styled.div` display: flex; flex-direction: column; gap: 20px; `;

const ReportCard = styled.div`
    background: white;
    border-radius: 25px;
    padding: 30px;
    box-shadow: 0 8px 25px rgba(116, 185, 255, 0.08);
    border: 1px solid #f1f2f6;
    transition: transform 0.2s;
    &:hover { transform: translateY(-3px); }
`;

const ReportHeader = styled.div` 
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; 
`;

const Badge = styled.span`
    font-size: 13px; padding: 6px 14px; border-radius: 10px; font-weight: bold;
    background: ${props => props.type === 'POST' ? '#f0f7ff' : '#f8f0ff'};
    color: ${props => props.type === 'POST' ? '#74b9ff' : '#a29bfe'};
`;

const Status = styled.span`
    font-size: 13px; font-weight: 800;
    padding: 6px 12px; border-radius: 10px;
    background: ${props => props.status === 'PENDING' ? '#fff9db' : '#ebfbee'};
    color: ${props => props.status === 'PENDING' ? '#f08c00' : '#40c057'};
`;

const ReasonSection = styled.div` margin-bottom: 20px; `;
const ReasonLabel = styled.div` font-size: 12px; color: #b2bec3; font-weight: bold; margin-bottom: 5px; `;
const ReasonText = styled.div` font-size: 17px; font-weight: 800; color: #2d3436; `;

const TargetBox = styled.div`
    background: #f8fbff; padding: 20px; border-radius: 15px; margin-bottom: 20px;
    .content-row { display: flex; gap: 15px; align-items: flex-start; }
`;

const TargetLabel = styled.div` font-size: 12px; color: #74b9ff; font-weight: bold; margin-bottom: 10px; `;
const TargetContent = styled.div` flex: 1; font-size: 14px; color: #636e72; line-height: 1.6; `;

const PostThumbnail = styled.img` 
    width: 80px; height: 80px; object-fit: cover; border-radius: 12px; border: 2px solid white;
    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
`;

const ReportFooter = styled.div`
    display: flex; justify-content: space-between; align-items: center;
    padding-top: 20px; border-top: 1px solid #f1f2f6;
`;

const UserInfo = styled.div` font-size: 14px; color: #636e72; b { color: #2d3436; } `;
const DateText = styled.div` font-size: 13px; color: #b2bec3; `;

const Loading = styled.div` 
    display: flex; justify-content: center; align-items: center; height: 80vh; 
    color: #74b9ff; font-weight: 900; font-size: 20px; 
`;

const EmptySection = styled.div`
    text-align: center; padding: 150px 0;
    .icon { font-size: 60px; margin-bottom: 20px; }
    p { color: #b2bec3; font-size: 18px; font-weight: bold; margin: 0; }
    span { 
        display: inline-block; margin-top: 15px; color: #74b9ff; cursor: pointer; 
        font-weight: bold; &:hover { text-decoration: underline; }
    }
`;

export default MyReportPage;