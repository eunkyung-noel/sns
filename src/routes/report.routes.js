// src/routes/report.routes.js

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller'); //이 파일은 3단계에서 완성
const { verifyToken, checkAdmin } = require('../middlewares/auth.middleware'); //checkAdmin은 2단계에서 완성

// 1. 신고 접수 (일반 사용자 기능)
// POST /report
router.post('/', verifyToken, reportController.createReport);

// 2. 신고 목록 조회 (관리자 기능)
// GET /report/list : 모든 신고 목록 조회
router.get('/list', verifyToken, checkAdmin, reportController.getReports);

// 3. 신고 처리 (관리자 기능)
// PUT /report/:reportId/process : 특정 신고 처리 상태 업데이트
router.put('/:reportId/process', verifyToken, checkAdmin, reportController.processReport);

module.exports = router;