const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 업로드 폴더 설정
const rootPath = path.join(__dirname, '..');
const uploadPath = path.join(rootPath, 'uploads');
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}
app.use('/uploads', express.static(uploadPath));

// MongoDB 연결
const mongoURI = process.env.DATABASE_URL;
if (!mongoURI) {
    console.error("❌ 에러: .env 파일에 DATABASE_URL이 정의되지 않았습니다.");
} else {
    mongoose.connect(mongoURI)
        .then(() => console.log('✅ [DATABASE] MongoDB Atlas 연결 성공!'))
        .catch(err => console.error('❌ [DATABASE] 연결 실패:', err.message));
}

// 라우터 불러오기
const postRoutes = require('./routes/post.routes');
const authRoutes = require('./routes/auth.routes');

// 라우터 등록
app.use('/api/posts', postRoutes);
app.use('/api/auth', authRoutes);

// 서버 실행
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});