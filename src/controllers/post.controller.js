const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const vision = require('@google-cloud/vision');
const path = require('path');

const client = new vision.ImageAnnotatorClient({
    keyFilename: path.resolve(process.cwd(), 'google-key.json')
});

const KOREAN_BAD_WORDS = ['씨발', '시발', 'ㅅㅂ', 'ㅆㅂ', 'ㅄ', '병신', '지랄', '존나', '개새끼', '개세끼', '미친놈', '미친년', '호로자식', '등신', '머저리', '닥쳐', '쓰레기', '걸레', '시버', '니미', '개소리', '엠창', '엄창', '느금마', '느금', '한남', '김치녀', '빨갱이', '틀딱', '꼴페미', '메갈', '일베', '성괴', '따먹', '보지', '자지', '섹스', '쎅쓰', '성인광고', '바카라', '토토', '조건만남', '카지노', '강간', '살인', '자살', '마약', '대마초', '창녀', '창남', '빡촌', '딸딸이', '야동', '포르노', '몰카', '도촬', '빠가', '개새', '미친', '뒈져', '꺼져'];

const filterBadWords = (text) => {
    if (!text) return "";
    let filteredText = text;
    KOREAN_BAD_WORDS.forEach(word => {
        const regex = new RegExp(word, 'gi');
        filteredText = filteredText.replace(regex, '***');
    });
    return filteredText;
};

// 1. 전체 게시글 조회
exports.getAllPosts = async (req, res) => {
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
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: "데이터 로드 실패" });
    }
};

// 2. 게시글 작성
exports.createPost = async (req, res) => {
    try {
        const { content } = req.body;
        const file = req.file;

        // ID 추출 (가장 확실한 경로 확인)
        const userId = req.user?.id || req.user?._id;
        if (!userId) return res.status(401).json({ message: "로그인이 필요합니다." });

        const authorId = String(userId);

        // 유저 존재 여부 사전 검증
        const user = await prisma.user.findUnique({ where: { id: authorId } });
        if (!user) return res.status(404).json({ message: "계정 정보를 찾을 수 없습니다. 다시 로그인하세요." });

        const cleanContent = filterBadWords(content);
        let isSafeImage = true;

        if (file) {
            try {
                const [result] = await client.safeSearchDetection(file.path);
                const detections = result.safeSearchAnnotation;
                const unsafe = ['LIKELY', 'VERY_LIKELY'];
                if (unsafe.includes(detections.adult) || unsafe.includes(detections.violence)) {
                    isSafeImage = false;
                }
            } catch (err) {
                console.error("Vision API 분석 실패:", err.message);
            }
        }

        // 게시글 생성 (authorId 필드가 아닌 author 관계 필드 사용)
        const newPost = await prisma.post.create({
            data: {
                content: cleanContent,
                imageUrl: file ? `/uploads/${file.filename}` : null,
                isSafe: isSafeImage,
                isSafeContent: (content === cleanContent),
                author: { connect: { id: authorId } } // 이 형식이 Prisma 표준입니다.
            },
            include: { author: { select: { id: true, name: true, nickname: true } } }
        });

        res.status(201).json(newPost);
    } catch (error) {
        console.error("❌ 게시글 저장 에러:", error);
        res.status(500).json({ message: "게시글 저장 실패", error: error.message });
    }
};

// 3. 게시글 삭제
exports.deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = String(req.user?.id || req.user?._id);

        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) return res.status(404).json({ message: "게시글 없음" });

        if (String(post.authorId) !== userId) return res.status(403).json({ message: "권한 없음" });

        await prisma.post.delete({ where: { id: postId } });
        res.status(200).json({ message: "삭제 성공", deletedId: postId });
    } catch (error) {
        res.status(500).json({ message: "삭제 실패" });
    }
};

// 4. 좋아요 토글
exports.toggleLike = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = String(req.user?.id || req.user?._id);

        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) return res.status(404).json({ message: "게시글 없음" });

        const currentLikes = post.likes || [];
        const updatedLikes = currentLikes.includes(userId)
            ? currentLikes.filter(id => id !== userId)
            : [...currentLikes, userId];

        const updatedPost = await prisma.post.update({
            where: { id: postId },
            data: { likes: updatedLikes }
        });
        res.status(200).json(updatedPost);
    } catch (error) {
        res.status(500).json({ message: "좋아요 실패" });
    }
};

// 5. 댓글 작성
exports.addComment = async (req, res) => {
    try {
        const { content } = req.body;
        const postId = req.params.id;
        const userId = String(req.user?.id || req.user?._id);

        const comment = await prisma.comment.create({
            data: {
                content: filterBadWords(content),
                post: { connect: { id: postId } },
                author: { connect: { id: userId } }
            },
            include: { author: { select: { name: true, nickname: true } } }
        });
        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ message: "댓글 실패" });
    }
};