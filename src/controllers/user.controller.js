const User = require('../models/User');

// 1. 사용자 프로필 조회
exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId)
            .select('-password') // 비밀번호 제외
            .populate('followers', 'name profileImage')
            .populate('following', 'name profileImage');

        if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });

        // 팔로워/팔로잉 수 포함하여 응답
        const userWithCounts = {
            ...user._doc,
            followerCount: user.followers.length,
            followingCount: user.following.length
        };

        res.status(200).json(userWithCounts);
    } catch (error) {
        res.status(500).json({ message: '서버 오류' });
    }
};

// 2. 유저 검색
exports.searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);

        // 이름에 검색어가 포함된 유저 검색 (대소문자 무시)
        const users = await User.find({
            name: { $regex: q, $options: 'i' }
        })
            .select('name profileImage')
            .limit(20);

        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "검색 실패" });
    }
};

// 3. 팔로우 토글
exports.toggleFollow = async (req, res) => {
    try {
        const myId = req.user.id || req.user._id; // 내 ID
        const targetId = req.params.userId; // 대상 ID

        if (myId.toString() === targetId.toString()) {
            return res.status(400).json({ message: "자기 자신을 팔로우할 수 없습니다." });
        }

        const me = await User.findById(myId);
        const target = await User.findById(targetId);

        if (!target) return res.status(404).json({ message: "대상을 찾을 수 없습니다." });

        const isFollowing = me.following.includes(targetId);

        if (isFollowing) {
            // 언팔로우
            me.following.pull(targetId);
            target.followers.pull(myId);
        } else {
            // 팔로우
            me.following.push(targetId);
            target.followers.push(myId);
        }

        await me.save();
        await target.save();

        res.json({ followed: !isFollowing });
    } catch (err) {
        res.status(500).json({ error: "팔로우 처리 실패" });
    }
};