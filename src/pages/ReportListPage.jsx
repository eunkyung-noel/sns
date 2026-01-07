import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

const ReportListPage = () => {
    const [reports, setReports] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // 백엔드 엔드포인트 호출 (현재 404가 뜨고 있다면 백엔드 구현 확인이 필요합니다)
        api.get('/posts/reports/my')
            .then(res => setReports(Array.isArray(res.data) ? res.data : []))
            .catch(() => setReports([]));
    }, []);

    return (
        <Container>
            <Header>
                <BackButton onClick={() => navigate(-1)}>⬅</BackButton>
                <Title>내 신고 내역</Title>
            </Header>
            <List>
                {reports.length > 0 ? reports.map(r => (
                    <ReportCard key={r.id}>
                        <ReasonTag>신고 사유</ReasonTag>
                        <ReasonText>{r.reason}</ReasonText>
                        <DateText>{new Date(r.createdAt).toLocaleString()}</DateText>
                    </ReportCard>
                )) : (
                    <EmptyWrapper>
                        <EmptyIcon>🫧</EmptyIcon>
                        <EmptyText>신고된 기록이 없습니다.</EmptyText>
                    </EmptyWrapper>
                )}
            </List>
        </Container>
    );
};

export default ReportListPage;

/* Styles */
const Container = styled.div`max-width: 600px; margin: 0 auto; padding: 20px;`;
const Header = styled.div`display: flex; align-items: center; gap: 15px; margin-bottom: 25px;`;
const BackButton = styled.button`background: none; border: none; font-size: 20px; cursor: pointer; color: #333;`;
const Title = styled.h2`margin: 0; font-size: 18px;`;
const List = styled.div`display: flex; flex-direction: column; gap: 12px;`;
const ReportCard = styled.div`padding: 15px; border: 1px solid #f1f2f6; border-radius: 12px; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.03);`;
const ReasonTag = styled.div`font-size: 11px; color: #e74c3c; font-weight: bold; margin-bottom: 5px;`;
const ReasonText = styled.div`font-size: 14px; color: #2f3542; margin-bottom: 8px; font-weight: 500;`;
const DateText = styled.div`font-size: 11px; color: #a4b0be;`;
const EmptyWrapper = styled.div`text-align: center; padding: 80px 0;`;
const EmptyIcon = styled.div`font-size: 40px; margin-bottom: 10px;`;
const EmptyText = styled.div`color: #ced4da; font-size: 14px;`;