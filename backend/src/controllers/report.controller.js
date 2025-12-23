const Post = require('../models/Post');

// 1. 게시글 작성 (isSafe 필드 포함)
exports.createPost = async (req, res) => {
    try {
        const { content } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
        const authorId = req.user?.id || req.user?._id;

        const newPost = new Post({
            content,
            imageUrl,
            isSafe: true, // 기본값 (Vision API 미사용 시)
            author: authorId
        });
        await newPost.save();
        const populatedPost = await Post.findById(newPost._id).populate('author', 'name nickname');
        res.status(201).json(populatedPost);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// 2. 전체 조회 (댓글 populate 필수)
exports.getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('author', 'name nickname')
            .populate('comments.author', 'name nickname') // 댓글 작성자 정보
            .sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (err) { res.status(500).json({ message: "로드 실패" }); }
};

// 3. 삭제 함수 (프론트 삭제 버튼용)
exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "글 없음" });
        if (post.author.toString() !== (req.user?.id || req.user?._id).toString()) {
            return res.status(403).json({ message: "권한 없음" });
        }
        await Post.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "삭제 성공" });
    } catch (err) { res.status(500).json({ message: "삭제 실패" }); }
};

// 4. 댓글 함수 (프론트 댓글창용)
exports.addComment = async (req, res) => {
    try {
        const { content } = req.body;
        const post = await Post.findById(req.params.id);
        post.comments.push({ content, author: req.user?.id || req.user?._id });
        await post.save();
        const updatedPost = await Post.findById(req.params.id)
            .populate('author', 'name nickname')
            .populate('comments.author', 'name nickname');
        res.status(201).json(updatedPost);
    } catch (err) { res.status(500).json({ message: "댓글 실패" }); }
};

// 5. 좋아요 함수
exports.toggleLike = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const userId = req.user?.id || req.user?._id;
        const index = post.likes.indexOf(userId);
        if (index === -1) post.likes.push(userId);
        else post.likes.splice(index, 1);
        await post.save();
        res.status(200).json({ likes: post.likes });
    } catch (err) { res.status(500).json({ message: "좋아요 실패" }); }
};