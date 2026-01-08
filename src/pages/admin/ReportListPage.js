import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';

function ReportListPage() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchReports = useCallback(async () => {
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        if (!isAdmin) {
            alert('접근 권한이 없습니다.');
            navigate('/feed');
            return;
        }

        try {
            setLoading(true);
            const response = await api.get('/admin/reports');
            setReports(response.data);
        } catch (error) {
            console.error('목록 조회 실패:', error);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleProcessReport = async (reportId, contentId, contentType) => {
        const actionName = contentType === 'post' ? '게시글' : '댓글';

        if (!window.confirm(`정말로 이 ${actionName}을 삭제하고 신고를 처리하시겠습니까?`)) {
            return;
        }

        try {
            await api.post(`/admin/reports/${reportId}/process`, { contentId, contentType });
            alert(`${actionName} 처리가 완료되었습니다.`);
            setReports(prev => prev.filter(r => r.id !== reportId));
        } catch (error) {
            const msg = error.response?.data?.message || '처리 중 오류가 발생했습니다.';
            alert(msg);
        }
    };

    if (loading) return <AdminWrapper><NoReports>데이터를 불러오는 중...</NoReports></AdminWrapper>;

    return (
        <AdminWrapper>
            <AdminHeader>
                <div className="title-area">
                    <h1>🛡️ 관리자 대시보드</h1>
                    <p>커뮤니티 가이드를 위반한 신고 내역을 검토합니다.</p>
                </div>
                <ReportCount>신고 대기 건수: <strong>{reports.length}</strong>건</ReportCount>
            </AdminHeader>

            <ReportListCard>
                {reports.length === 0 ? (
                    <NoReports>현재 처리할 신고가 없습니다. 깨끗한 커뮤니티네요! 🫧</NoReports>
                ) : (
                    <TableContainer>
                        <StyledTable>
                            <thead>
                            <tr>
                                <th>구분</th>
                                <th>신고 사유</th>
                                <th>콘텐츠 내용</th>
                                <th>신고일시</th>
                                <th>관리</th>
                            </tr>
                            </thead>
                            <tbody>
                            {reports.map(report => (
                                <tr key={report.id}>
                                    <td>
                                        <ReportType type={report.contentType}>
                                            {report.contentType === 'post' ? '게시글' : '댓글'}
                                        </ReportType>
                                    </td>
                                    <td><ReasonText>{report.reason}</ReasonText></td>
                                    <td>
                                        <ContentPreview>
                                            {report.contentPreview || '내용 없음'}
                                        </ContentPreview>
                                    </td>
                                    <td><TimeText>{new Date(report.createdAt).toLocaleString()}</TimeText></td>
                                    <td>
                                        <ActionButton onClick={() => handleProcessReport(report.id, report.contentId, report.contentType)}>
                                            삭제/처리
                                        </ActionButton>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </StyledTable>
                    </TableContainer>
                )}
            </ReportListCard>
        </AdminWrapper>
    );
}

export default ReportListPage;

/* --- 스타일 수정 (관리자 대시보드형 웹 최적화) --- */

const AdminWrapper = styled.div`
    max-width: 1200px;
    margin: 100px auto 50px; /* Header 높이 고려 상단 여백 */
    padding: 0 40px;
    min-height: 80vh;
`;

const AdminHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 30px;
    .title-area h1 { color: #333; font-size: 32px; margin: 0; }
    .title-area p { color: #888; margin-top: 10px; }
`;

const ReportCount = styled.div`
    background: #fff;
    padding: 10px 20px;
    border-radius: 10px;
    border: 1px solid #eee;
    font-size: 15px;
    strong { color: #e53935; font-size: 18px; }
`;

const ReportListCard = styled.div`
    background: white;
    border-radius: 16px;
    border: 1px solid #eee;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    overflow: hidden;
`;

const TableContainer = styled.div` overflow-x: auto; `;

const StyledTable = styled.table`
    width: 100%;
    border-collapse: collapse;
    th, td { padding: 18px; text-align: left; border-bottom: 1px solid #f1f1f1; }
    thead { background: #fafafa; th { color: #666; font-weight: 600; font-size: 14px; } }
    tbody tr:hover { background: #fcfcfc; }
`;

const ReportType = styled.span`
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: bold;
    color: white;
    background: ${props => props.type === 'post' ? '#74b9ff' : '#a29bfe'};
`;

const ReasonText = styled.span` font-size: 14px; color: #d32f2f; font-weight: 500; `;

const ContentPreview = styled.div`
    font-size: 13px;
    color: #555;
    max-width: 400px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const TimeText = styled.span` font-size: 13px; color: #999; `;

const ActionButton = styled.button`
    padding: 8px 14px;
    background: #ff4757;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: bold;
    transition: 0.2s;
    &:hover { background: #e84118; transform: translateY(-1px); }
`;

const NoReports = styled.div`
    text-align: center;
    padding: 80px 0;
    color: #bbb;
    font-size: 16px;
`;