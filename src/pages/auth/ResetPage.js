import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

function ReportListPage() {
    const [reports, setReports] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        if (!isAdmin) {
            alert('접근 권한이 없습니다.');
            navigate('/feed');
            return;
        }

        const fetchReports = async () => {
            try {
                const response = await api.get('/admin/reports');
                setReports(response.data);
            } catch (error) {
                console.error('신고 목록 불러오기 실패:', error);
                alert(error.response?.data?.message || '신고 목록을 불러오는 중 오류가 발생했습니다.');
                if (error.response?.status === 401 || error.response?.status === 403) {
                    localStorage.removeItem('token');
                    navigate('/login');
                }
            }
        };
        fetchReports();
    }, [navigate]);

    const handleProcessReport = async (reportId, contentId, contentType) => {
        const action = contentType === 'post' ? '게시글' : '댓글';
        if (!window.confirm(`정말로 이 ${action}을 삭제하고 신고를 처리하시겠습니까?`)) {
            return;
        }

        try {
            await api.post(`/admin/reports/${reportId}/process`, { contentId, contentType });
            alert(`${action}이 삭제되고 신고가 처리되었습니다.`);
            setReports(reports.filter(r => r.id !== reportId));
        } catch (error) {
            console.error('신고 처리 실패:', error);
            alert(error.response?.data?.message || '신고 처리 중 오류가 발생했습니다.');
        }
    };

    return (
        <AdminContainer>
            <AdminHeader>
                <h1>🛡️ 관리자 신고 목록</h1>
            </AdminHeader>

            <ReportCount>총 신고 건수: {reports.length}건</ReportCount>

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
                                        {report.contentType === 'post' ? '게시글' : '댓글'} 신고
                                    </ReportType>
                                    <ReportTime>{new Date(report.createdAt).toLocaleString()}</ReportTime>
                                </ReportMeta>
                                <ReportReason>
                                    <strong>신고 사유:</strong> {report.reason}
                                </ReportReason>
                                <ReportContentPreview>
                                    <strong>문제의 내용:</strong> {report.contentPreview.substring(0, 150)}...
                                </ReportContentPreview>
                            </ReportDetails>

                            <ActionButton
                                onClick={() => handleProcessReport(report.id, report.contentId, report.contentType)}
                            >
                                콘텐츠 삭제 및 처리
                            </ActionButton>
                        </ReportItem>
                    ))
                )}
            </ReportList>
        </AdminContainer>
    );
}

export default ReportListPage;

const AdminContainer = styled.div`
  max-width: 1000px;
  margin: 30px auto;
  padding: 0 20px;
`;

const AdminHeader = styled.div`
    border-bottom: 2px solid #ef9a9a;
    padding-bottom: 15px;
    margin-bottom: 25px;
    h1 {
        color: #e53935;
        font-size: 30px;
    }
`;

const ReportCount = styled.p`
    font-size: 18px;
    color: #424242;
    margin-bottom: 20px;
    font-weight: 500;
`;

const ReportList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const ReportItem = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  border-left: 5px solid #ef5350;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ReportDetails = styled.div`
    flex-grow: 1;
`;

const ReportId = styled.span`
    font-size: 12px;
    color: #9e9e9e;
    margin-bottom: 5px;
    display: block;
`;

const ReportMeta = styled.div`
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 10px;
`;

const ReportType = styled.span`
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: bold;
    color: white;
    background-color: ${props => (props.type === 'post' ? '#e57373' : '#f48fb1')};
`;

const ReportTime = styled.span`
    font-size: 14px;
    color: #757575;
`;

const ReportReason = styled.p`
    font-size: 15px;
    margin-bottom: 5px;
    strong {
        color: #e53935;
        font-weight: bold;
    }
`;

const ReportContentPreview = styled.p`
    font-size: 14px;
    color: #555;
`;

const ActionButton = styled.button`
  padding: 10px 15px;
  background-color: #ef5350;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
  &:hover {
    background-color: #e53935;
  }
`;

const NoReports = styled.div`
    text-align: center;
    padding: 40px;
    border: 1px dashed #ef9a9a;
    border-radius: 8px;
    color: #e53935;
    background-color: #ffebee;
    font-size: 18px;
    font-weight: bold;
`;