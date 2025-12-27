const Message = require('../models/Message');
const User = require('../models/User');

exports.searchUsers = async (req, res) => {
    try {
        const { term } = req.query;
        const users = await User.find({
            _id: { $ne: req.userId },
            $or: [{ name: { $regex: term, $options: 'i' } }, { username: { $regex: term, $options: 'i' } }]
        }).select('name username profileImage');
        res.json(users);
    } catch (err) { res.status(500).json({ message: "검색 실패" }); }
};

exports.getChatRooms = async (req, res) => {
    try {
        const userId = req.userId.toString();
        const rooms = await Message.aggregate([
            { $match: { $or: [{ senderId: userId }, { receiverId: userId }] } },
            { $sort: { createdAt: -1 } },
            { $group: {
                    _id: { $cond: [{ $gt: ["$senderId", "$receiverId"] }, { s: "$senderId", r: "$receiverId" }, { s: "$receiverId", r: "$senderId" }] },
                    lastMessage: { $first: "$content" },
                    lastTimestamp: { $first: "$createdAt" },
                    partnerId: { $first: { $cond: [{ $eq: ["$senderId", userId] }, "$receiverId", "$senderId"] } },
                    unreadCount: { $sum: { $cond: [{ $and: [{ $eq: ["$receiverId", userId] }, { $eq: ["$isRead", false] }] }, 1, 0] } }
                }},
            { $sort: { lastTimestamp: -1 } }
        ]);
        const roomsWithInfo = await Promise.all(rooms.map(async (room) => {
            const partner = await User.findById(room.partnerId).select('name profileImage');
            return { ...room, partnerName: partner?.name || '유저', partnerProfile: partner?.profileImage };
        }));
        res.json(roomsWithInfo);
    } catch (err) { res.status(500).json({ message: "목록 실패" }); }
};

exports.getChatDetail = async (req, res) => {
    try {
        const { partnerId } = req.params;
        const userId = req.userId.toString();
        const partner = await User.findById(partnerId).select('name');
        const messages = await Message.find({
            $or: [{ senderId: userId, receiverId: partnerId }, { senderId: partnerId, receiverId: userId }]
        }).sort({ createdAt: 1 });
        res.json({ partnerName: partner ? partner.name : "알 수 없음", messages });
    } catch (err) { res.status(500).json({ message: "상세 실패" }); }
};

exports.sendDM = async (req, res) => {
    try {
        const newMessage = new Message({ ...req.body, senderId: req.userId, isRead: false });
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (err) { res.status(500).json({ message: "실패" }); }
};