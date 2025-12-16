// src/controllers/report.controller.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. 신고 접수 (POST /report)
exports.createReport = async (req, res) => {
    // req.user.id는 verifyToken 미들웨어를 통해 얻은 신고자 ID입니다.
    const reporterId = req.user.id;
    const { postId, reason } = req.body;

    if (!postId || !reason) {
        return res.status(400).json({ message: '신고 대상 게시글 ID와 사유를 제공해야 합니다.' });
    }

    try {
        const newReport = await prisma.report.create({
            data: {
                reporterId,
                postId,
                reason,
                status: 'PENDING', // 기본 상태: 대기 중
            },
        });

        res.status(201).json({ message: '신고가 성공적으로 접수되었습니다.', report: newReport });
    } catch (error) {
        console.error('신고 접수 오류:', error);
        res.status(500).json({ message: '신고 접수 중 서버 오류가 발생했습니다.' });
    }
};

// 2. 신고 목록 조회 (GET /report/list) - 관리자용
exports.getReports = async (req, res) => {
    try {
        // 모든 신고 목록을 최신 순으로 조회
        const reports = await prisma.report.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                reporter: { select: { id: true, name: true } },
                post: { select: { id: true, content: true } },
            },
        });

        res.status(200).json(reports);
    } catch (error) {
        console.error('신고 목록 조회 오류:', error);
        res.status(500).json({ message: '신고 목록 조회 중 서버 오류가 발생했습니다.' });
    }
};

// 3. 신고 처리 상태 업데이트 (PUT /report/:reportId/process) - 관리자용
exports.processReport = async (req, res) => {
    const reportId = parseInt(req.params.reportId);
    const { status, actionTaken } = req.body; // status: PROCESSED, REJECTED 등

    if (!status) {
        return res.status(400).json({ message: '처리 상태(status)를 제공해야 합니다.' });
    }

    try {
        const updatedReport = await prisma.report.update({
            where: { id: reportId },
            data: {
                status,
                actionTaken: actionTaken || null, // 처리 내용 (예: 게시글 삭제, 사용자 경고 등)
                processedAt: new Date(),
            },
        });

        res.status(200).json({ message: '신고 처리가 완료되었습니다.', report: updatedReport });
    } catch (error) {
        console.error('신고 처리 오류:', error);
        res.status(500).json({ message: '신고 처리 중 서버 오류가 발생했습니다.' });
    }
};