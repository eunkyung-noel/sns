const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 욕설 키워드 (1차 MVP)
const BAD_WORDS = ['시발', '병신', 'fuck', 'shit'];

exports.createReport = async (req, res) => {
    try {
        const reporterId = req.user.userId;
        const { targetType, targetId, reason } = req.body;

        // 욕설 필터
        const hasBadWord = BAD_WORDS.some(word => reason.includes(word));
        if (hasBadWord) {
            return res.status(400).json({
                message: '신고 사유에 부적절한 표현이 포함되어 있습니다'
            });
        }

        const report = await prisma.report.create({
            data: {
                reporterId,
                targetType,
                targetId,
                reason
            }
        });

        res.json({
            message: '신고 접수 완료',
            report
        });
    } catch (err) {
        res.status(500).json({
            message: '신고 실패',
            error: err.message
        });
    }
};
