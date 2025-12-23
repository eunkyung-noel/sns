const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    content: { type: String, required: true },
    // 컨트롤러의 imageUrl과 이름을 맞추기 위해 imageUrl로 수정
    imageUrl: { type: String },
    // 이미지 블러 여부 (true: 안전, false: 부적절/블러필요)
    isSafe: { type: Boolean, default: true },
    // 텍스트 비속어 여부 (true: 안전, false: 비속어있음/블러필요)
    isSafeContent: { type: Boolean, default: true },
    // 작성자 정보
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // 좋아요 누른 유저들
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // 댓글 리스트
    comments: [{
        content: String,
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);