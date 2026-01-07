const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // 🔍 _id 정의를 아예 삭제하십시오. Mongoose가 자동으로 관리하게 둡니다.
    username: { type: String, required: true },
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    birthdate: { type: String },
    profileImage: { type: String, default: "" },
    bio: { type: String, default: "" },
    followers: [{ type: String }],
    following: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);