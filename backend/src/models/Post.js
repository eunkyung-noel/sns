const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    content: { type: String, required: true },
    imageUrl: { type: String },
    // 🔍 User 모델의 _id가 String이므로 String으로 설정
    author: { type: String, ref: 'User', required: true },
    likes: [{ type: String }], // 게시글 좋아요
    comments: [{
        content: String,
        author: { type: String, ref: 'User' },
        likes: [{ type: String }], // 🔍 추가: 댓글 좋아요 유저 ID 저장 배열
        createdAt: { type: Date, default: Date.now }
    }],
    isSafe: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);