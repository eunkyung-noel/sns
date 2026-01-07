import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

const MyReportPage = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // [Fact] 백엔드 포트가 5001번이므로 이미지 로드 시 참조
    const SERVER_URL = 'http://localhost:5001';

    const fetchReports = async () => {
        try {
            setLoading(true);
            // 백엔드 라우트: GET /api/posts/reports/my (토큰 기반 본인 신고 내역 조회)
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
                <BackButton onClick={() => navigate(-1)}>←</BackButton>
                <Title>내 신고 내역</Title>
            </Header>

            {reports.length > 0 ? (
                <ReportList>
                    {reports.map((report) => (
                        <ReportCard key={report.id}>
                            <ReportHeader>
                                <Badge type={report.type}>
                                    {report.type === 'POST' ? '게시글 신고' : '댓글 신고'}
                                </Badge>
                                <Status status={report.status}>{report.status}</Status>
                            </ReportHeader>

                            <Reason>신고 사유: {report.reason}</Reason>

                            <TargetBox>
                                <strong>신고된 내용:</strong>
                                <p>
                                    {report.type === 'POST'
                                        ? (report.post?.content || "내용 없음")
                                        : (report.comment?.content || "내용 없음")}
                                </p>
                                {report.type === 'POST' && report.post?.imageUrl && (
                                    <PostThumbnail src={`${SERVER_URL}${report.post.imageUrl}`} alt="post" />
                                )}
                            </TargetBox>

                            <ReportFooter>
                                <span>대상 유저: @{report.target?.nickname || '알 수 없음'}</span>
                                <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                            </ReportFooter>
                        </ReportCard>
                    ))}
                </ReportList>
            ) : (
                <Empty>🚫 신고한 기록이 없습니다.</Empty>
            )}
        </Container>
    );
};

// --- 스타일 컴포넌트 ---
const Container = styled.div`max-width: 600px; margin: 0 auto; padding: 20px; font-family: sans-serif;`;
const Header = styled.div`display: flex; align-items: center; gap: 15px; margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 15px;`;
const BackButton = styled.button`background: none; border: none; font-size: 24px; cursor: pointer; color: #555;`;
const Title = styled.h2`margin: 0; font-size: 18px; color: #333;`;

const ReportList = styled.div`display: flex; flex-direction: column; gap: 15px;`;
const ReportCard = styled.div`background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 18px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);`;

const ReportHeader = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;`;
const Badge = styled.span`
    font-size: 11px; padding: 3px 8px; border-radius: 4px; font-weight: bold;
    background: ${props => props.type === 'POST' ? '#e3f2fd' : '#f3e5f5'};
    color: ${props => props.type === 'POST' ? '#1976d2' : '#7b1fa2'};
`;

const Status = styled.span`
    font-size: 12px; font-weight: bold;
    color: ${props => props.status === 'PENDING' ? '#f59e0b' : '#10b981'};
`;

const Reason = styled.p`margin: 0 0 10px; font-size: 14px; color: #333; font-weight: 600;`;

const TargetBox = styled.div`
    background: #f8f9fa; padding: 12px; border-radius: 8px; font-size: 13px; color: #666; margin-bottom: 12px;
    strong { display: block; margin-bottom: 6px; color: #444; font-size: 12px; }
    p { margin: 0; line-height: 1.4; }
`;

const PostThumbnail = styled.img`width: 60px; height: 60px; object-fit: cover; border-radius: 4px; margin-top: 10px; border: 1px solid #eee;`;

const ReportFooter = styled.div`display: flex; justify-content: space-between; font-size: 12px; color: #999; border-top: 1px dotted #eee; pt: 10px; margin-top: 5px;`;
const Loading = styled.div`display: flex; justify-content: center; align-items: center; height: 60vh; color: #888; font-size: 14px;`;
const Empty = styled.div`text-align: center; padding: 120px 0; color: #bbb; font-size: 15px;`;

export default MyReportPage;