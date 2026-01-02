const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const badWords = [
    'ㅅㅂ', '시발', '씨발', '병신', 'ㅄ', 'ㅂㅅ', '새끼', 'ㄲㅏ', '존나', '졸라',
    '개새끼', '미친', '지랄', '엠창', '엄창', '느금', '니기미', '씨부레', '씨부랄', '씌발',
    'tq', 'ㅅㅐㄲㅣ', 'ㅈㄴ', 'ㅆㅂ', '凸', '뻐큐', '등신', '멍청이', '쓰레기', '호로',
    '쌍놈', '썅', '샹놈', '씹', '잡놈', '변태', '띨띨', '닥쳐', '아가리', '주둥이',
    '미친개', '미친놈', '미친년', '걸레', '창녀', '화냥년', '씨팔', '지랄마', '염병', '옘병',
    '뒤져', '뒈져', '꺼져', '빡대가리', '대가리', '뇌가리', '호구', '찐따', '일베', '메갈'
];

const checkAndFilter = (text) => {
    let filteredText = text || "";
    badWords.forEach(word => {
        if (filteredText.includes(word)) {
            filteredText = filteredText.split(word).join('🫧🫧🫧🫧');
        }
    });
    return { filteredText };
};

// 1. 게시글 작성
const createPost = async (req, res) => {
    try {
        const content = req.body.content || "";
        const { filteredText } = checkAndFilter(content);

        const newPost = await prisma.post.create({
            data: {
                content: filteredText,
                imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
                authorId: req.userId,
                likes: [] // Json 타입이므로 빈 배열 직접 삽입 가능
            },
            include: { author: { select: { id: true, name: true, nickname: true } } }
        });
        res.status(201).json(newPost);
    } catch (err) {
        console.error("❌ 게시글 작성 에러:", err);
        res.status(500).json({ message: `서버 에러: ${err.message}` });
    }
};

// 2. 댓글 작성 (스키마 likes 추가 반영 버전)
const addComment = async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ message: "내용이 없습니다." });

        const { filteredText } = checkAndFilter(content);

        await prisma.comment.create({
            data: {
                content: filteredText,
                postId: req.params.id,
                authorId: req.userId,
                likes: [] // 스키마에 likes Json 필드 추가됨
            }
        });
        res.status(201).json({ message: "댓글 성공" });
    } catch (err) {
        console.error("❌ 댓글 작성 에러:", err.message);
        res.status(500).json({ message: `댓글 실패: ${err.message}` });
    }
};

// 3. 전체 조회
const getAllPosts = async (req, res) => {
    try {
        const posts = await prisma.post.findMany({
            include: {
                author: { select: { id: true, name: true, nickname: true } },
                comments: {
                    include: { author: { select: { id: true, name: true, nickname: true } } },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Json 타입은 별도의 JSON.parse 없이 바로 사용 가능
        const formattedPosts = posts.map(p => ({
            ...p,
            likes: Array.isArray(p.likes) ? p.likes : []
        }));

        res.status(200).json(formattedPosts);
    } catch (err) {
        res.status(500).json({ message: "로드 실패" });
    }
};

// 4. 게시글 수정
const updatePost = async (req, res) => {
    try {
        const { content } = req.body;
        const { filteredText } = checkAndFilter(content);
        await prisma.post.update({ where: { id: req.params.id }, data: { content: filteredText } });
        res.status(200).json({ message: "수정 성공" });
    } catch (err) { res.status(500).json({ message: "수정 실패" }); }
};

// 5. 댓글 수정
const updateComment = async (req, res) => {
    try {
        const { content } = req.body;
        const { filteredText } = checkAndFilter(content);
        await prisma.comment.update({ where: { id: req.params.commentId }, data: { content: filteredText } });
        res.status(200).json({ message: "성공" });
    } catch (err) { res.status(500).json({ message: "실패" }); }
};

// 6. 삭제 기능
const deletePost = async (req, res) => {
    try { await prisma.post.delete({ where: { id: req.params.id } }); res.status(200).json({ message: "성공" }); } catch (err) { res.status(500).json({ message: "실패" }); }
};

const deleteComment = async (req, res) => {
    try { await prisma.comment.delete({ where: { id: req.params.commentId } }); res.status(200).json({ message: "성공" }); } catch (err) { res.status(500).json({ message: "실패" }); }
};

// 7. 게시글 좋아요 토글
const toggleLike = async (req, res) => {
    try {
        const post = await prisma.post.findUnique({ where: { id: req.params.id } });
        let likes = Array.isArray(post.likes) ? post.likes : [];

        const idx = likes.indexOf(req.userId);
        idx === -1 ? likes.push(req.userId) : likes.splice(idx, 1);

        const updated = await prisma.post.update({
            where: { id: req.params.id },
            data: { likes }
        });
        res.status(200).json({ likes: updated.likes });
    } catch (err) { res.status(500).json({ message: "실패" }); }
};

// 8. 댓글 좋아요 토글 (하트 기능)
const toggleCommentLike = async (req, res) => {
    try {
        const comment = await prisma.comment.findUnique({ where: { id: req.params.commentId } });
        if (!comment) return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });

        let likes = Array.isArray(comment.likes) ? comment.likes : [];
        const idx = likes.indexOf(req.userId);

        idx === -1 ? likes.push(req.userId) : likes.splice(idx, 1);

        const updated = await prisma.comment.update({
            where: { id: req.params.commentId },
            data: { likes }
        });
        res.status(200).json({ likes: updated.likes });
    } catch (err) {
        res.status(500).json({ message: "댓글 좋아요 실패: " + err.message });
    }
};

module.exports = {
    createPost, getAllPosts, updatePost, deletePost, toggleLike,
    addComment, updateComment, deleteComment, toggleCommentLike
};