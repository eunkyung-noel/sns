import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api'; // 경로 확인 필요

function ReportListPage() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // 관리자 권한 및 목록 조회 함수
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

    // 신고 처리 및 콘텐츠 삭제 함수
    const handleProcessReport = async (reportId, contentId, contentType) => {
        const actionName = contentType === 'post' ? '게시글' : '댓글';

        if (!window.confirm(`정말로 이 ${actionName}을 삭제하고 신고를 처리하시겠습니까?`)) {
            return;
        }

        try {
            await api.post(`/admin/reports/${reportId}/process`, { contentId, contentType });
            alert(`${actionName} 처리가 완료되었습니다.`);
            // 처리된 항목만 목록에서 제거
            setReports(prev => prev.filter(r => r.id !== reportId));
        } catch (error) {
            const msg = error.response?.data?.message || '처리 중 오류가 발생했습니다.';
            alert(msg);
        }
    };

    if (loading) return <AdminContainer><NoReports>데이터를 불러오는 중...</NoReports></AdminContainer>;

    return (
        <AdminContainer>
            <AdminHeader>
                <h1>🛡️ 관리자 신고 목록</h1>
            </AdminHeader>
            <ReportCount>총 신고 건수: <strong>{reports.length}</strong>건</ReportCount>
            <ReportList>
                {reports.length === 0 ? (
                    <NoReports>현재 처리할 신고가 없습니다.</NoReports>
                ) : (
                    reports.map(report => (
                        <ReportItem key={report.id}>
                            <ReportDetails>
                                <ReportId>신고 ID: {report.id}</ReportId>
                                <ReportMeta>
                                    <ReportType type={report.contentType}>
                                        {report.contentType === 'post' ? '게시글' : '댓글'}
                                    </ReportType>
                                    <ReportTime>{new Date(report.createdAt).toLocaleString()}</ReportTime>
                                </ReportMeta>
                                <ReportReason>
                                    <strong>사유:</strong> {report.reason}
                                </ReportReason>
                                <ReportContentPreview>
                                    <strong>내용:</strong> {report.contentPreview?.substring(0, 100)}...
                                </ReportContentPreview>
                            </ReportDetails>
                            <ActionButton onClick={() => handleProcessReport(report.id, report.contentId, report.contentType)}>
                                삭제 및 처리
                            </ActionButton>
                        </ReportItem>
                    ))
                )}
            </ReportList>
        </AdminContainer>
    );
}

export default ReportListPage;

// --- CSS-in-JS (Styled Components) ---
const AdminContainer = styled.div`max-width: 1000px; margin: 30px auto; padding: 0 20px;`;
const AdminHeader = styled.div`border-bottom: 2px solid #ef9a9a; padding-bottom: 15px; margin-bottom: 25px; h1 { color: #e53935; font-size: 28px; }`;
const ReportCount = styled.p`font-size: 16px; margin-bottom: 20px; strong { color: #e53935; }`;
const ReportList = styled.div`display: flex; flex-direction: column; gap: 15px;`;
const ReportItem = styled.div`background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border-left: 5px solid #ef5350; display: flex; justify-content: space-between; align-items: center;`;
const ReportDetails = styled.div`flex: 1; margin-right: 20px;`;
const ReportId = styled.span`font-size: 11px; color: #999; display: block;`;
const ReportMeta = styled.div`display: flex; align-items: center; gap: 10px; margin: 5px 0;`;
const ReportType = styled.span`padding: 3px 8px; border-radius: 4px; font-size: 12px; color: white; background: ${props => props.type === 'post' ? '#e57373' : '#f48fb1'};`;
const ReportTime = styled.span`font-size: 13px; color: #757575;`;
const ReportReason = styled.p`font-size: 14px; margin: 5px 0; strong { color: #d32f2f; }`;
const ReportContentPreview = styled.p`font-size: 13px; color: #666; background: #f9f9f9; padding: 8px; border-radius: 4px;`;
const ActionButton = styled.button`padding: 10px 16px; background: #ef5350; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; &:hover { background: #d32f2f; }`;
const NoReports = styled.div`text-align: center; padding: 50px; border: 1px dashed #ccc; border-radius: 8px; color: #999;`;