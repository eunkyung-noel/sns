const Post = require('../models/Post');
const User = require('../models/User');

// --- 비속어 필터링 로직 ---
const badWords = [
    'ㅅㅂ', '시발', '씨발', '병신', 'ㅄ', 'ㅂㅅ', '새끼', 'ㄲㅏ', '존나', '졸라',
    '개새끼', '미친', '지랄', '엠창', '엄창', '느금', '니기미', '씨부레', '씨부랄', '씌발',
    'tq', 'ㅅㅐㄲㅣ', 'ㅈㄴ', 'ㅆㅂ', '凸', '뻐큐', '등신', '멍청이', '쓰레기', '호로',
    '쌍놈', '썅', '샹놈', '씹', '잡놈', '변태', '띨띨', '닥쳐', '아가리', '주둥이',
    '미친개', '미친놈', '미친년', '걸레', '창녀', '화냥년', '씨팔', '지랄마', '염병', '옘병',
    '뒤져', '뒈져', '꺼져', '빡대가리', '대가리', '뇌가리', '호구', '찐따', '일베', '메갈',
    'tqsusdk', 'tqtoRl'
];

const checkAndFilter = (text) => {
    let isSafe = true;
    let filteredText = text || "";
    badWords.forEach(word => {
        if (filteredText.includes(word)) {
            isSafe = false;
            const replacement = '🫧🫧🫧🫧';
            const regex = new RegExp(word, 'g');
            filteredText = filteredText.replace(regex, replacement);
        }
    });
    return { isSafe, filteredText };
};

// 1. 게시글 작성
exports.createPost = async (req, res) => {
    try {
        const { content } = req.body;
        const { isSafe, filteredText } = checkAndFilter(content);
        const user = await User.findById(req.userId);
        const newPost = new Post({
            content: filteredText,
            imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
            isSafe,
            author: req.userId
        });
        await newPost.save();
        console.log(`[POST-LOG] 글 작성 완료: ${user?.name} - 안전: ${isSafe}`);
        res.status(201).json(await Post.findById(newPost._id).populate('author', 'name username'));
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// 2. 전체 조회
exports.getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().populate('author', 'name username').sort({ createdAt: -1 });
        console.log(`[POST-LOG] 전체 피드 조회 완료 (글 개수: ${posts.length})`);
        res.status(200).json(posts);
    } catch (err) { res.status(500).json({ message: "로드 실패" }); }
};

// 3. 게시글 수정
exports.updatePost = async (req, res) => {
    try {
        const { content } = req.body;
        const { isSafe, filteredText } = checkAndFilter(content);
        const post = await Post.findById(req.params.id);
        if (!post || post.author.toString() !== req.userId) return res.status(403).json({ message: "권한 없음" });
        post.content = filteredText;
        post.isSafe = isSafe;
        await post.save();
        console.log(`[POST-LOG] 글 수정 완료: [PostID: ${req.params.id}]`);
        res.status(200).json(post);
    } catch (err) { res.status(500).json({ message: "수정 실패" }); }
};

// 4. 게시글 삭제
exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post || post.author.toString() !== req.userId) return res.status(403).json({ message: "권한 없음" });
        await Post.findByIdAndDelete(req.params.id);
        console.log(`[POST-LOG] 글 삭제 완료: [PostID: ${req.params.id}]`);
        res.status(200).json({ message: "삭제 성공" });
    } catch (err) { res.status(500).json({ message: "삭제 실패" }); }
};

// 5. 게시글 좋아요 토글
exports.toggleLike = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const index = post.likes.findIndex(id => id.toString() === req.userId);
        index === -1 ? post.likes.push(req.userId) : post.likes.splice(index, 1);
        await post.save();
        console.log(`[POST-LOG] 글 좋아요 토글: [PostID: ${req.params.id}]`);
        res.status(200).json({ likes: post.likes });
    } catch (err) { res.status(500).json({ message: "좋아요 실패" }); }
};

// 6. 댓글 작성
exports.addComment = async (req, res) => {
    try {
        const { content } = req.body;
        const { filteredText } = checkAndFilter(content);
        const post = await Post.findById(req.params.id);
        post.comments.push({ content: filteredText, author: req.userId });
        await post.save();
        console.log(`[POST-LOG] 댓글 작성 완료: [PostID: ${req.params.id}]`);
        const updated = await Post.findById(req.params.id).populate('comments.author', 'name username');
        res.status(201).json(updated.comments);
    } catch (err) { res.status(500).json({ message: "댓글 실패" }); }
};

// 7. 댓글 수정 (누락된 함수 추가)
exports.updateComment = async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const { content } = req.body;
        const { filteredText } = checkAndFilter(content);
        const post = await Post.findById(postId);
        const comment = post.comments.id(commentId);
        if (!comment || comment.author.toString() !== req.userId) return res.status(403).json({ message: "권한 없음" });
        comment.content = filteredText;
        await post.save();
        console.log(`[POST-LOG] 댓글 수정 완료: [CommentID: ${commentId}]`);
        res.status(200).json({ message: "수정 성공" });
    } catch (err) { res.status(500).json({ message: "댓글 수정 실패" }); }
};

// 8. 댓글 삭제 (누락된 함수 추가)
exports.deleteComment = async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const post = await Post.findById(postId);
        const comment = post.comments.id(commentId);
        if (!comment || comment.author.toString() !== req.userId) return res.status(403).json({ message: "권한 없음" });
        comment.deleteOne();
        await post.save();
        console.log(`[POST-LOG] 댓글 삭제 완료: [CommentID: ${commentId}]`);
        res.status(200).json({ message: "삭제 성공" });
    } catch (err) { res.status(500).json({ message: "댓글 삭제 실패" }); }
};

// 9. 댓글 좋아요 토글 (누락된 함수 추가)
exports.toggleCommentLike = async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const post = await Post.findById(postId);
        const comment = post.comments.id(commentId);
        const index = comment.likes.findIndex(id => id.toString() === req.userId);
        index === -1 ? comment.likes.push(req.userId) : comment.likes.splice(index, 1);
        await post.save();
        console.log(`[POST-LOG] 댓글 좋아요 토글: [CommentID: ${commentId}]`);
        res.status(200).json({ likes: comment.likes });
    } catch (err) { res.status(500).json({ message: "댓글 좋아요 실패" }); }
};