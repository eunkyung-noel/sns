const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { filterText } = require('../utils/aiFilter'); // AI 필터 유틸리티 불러오기

// 1. 게시글 생성 (Create Post) - AI 필터 적용
exports.createPost = async (req, res) => {
    try {
        const authorId = req.user.userId;
        const { title, content, visibility, imageUrl } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: '제목과 내용을 모두 입력해야 합니다.' });
        }

        // 텍스트 필터링 적용
        // filterText 유틸리티가 { isAdultContent, filteredContent }를 반환한다고 가정합니다.
        const { isAdultContent, filteredContent } = filterText(content);

        const post = await prisma.post.create({
            data: {
                title,
                content: filteredContent,
                visibility,
                authorId,
                isAdultContent: isAdultContent,
                imageUrl: imageUrl || null,
            },
            include: { author: { select: { id: true, name: true } } }
        });

        res.status(201).json({ message: '게시글 생성 완료', post });
    } catch (err) {
        console.error('게시글 생성 실패:', err);
        res.status(500).json({ message: '게시글 생성 실패', error: err.message });
    }
};

// 2. 게시글 목록 조회 (Read Posts) - 미성년자 필터링 유지
exports.getPosts = async (req, res) => {
    const userId = req.user ? req.user.userId : null;

    try {
        let whereCondition = {};

        // 미성년자 또는 비회원일 경우 성인 콘텐츠 필터링
        if (!userId) {
            whereCondition.isAdultContent = false;
        } else {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { isMinor: true } });
            if (user && user.isMinor) {
                whereCondition.isAdultContent = false;
            }
        }

        const posts = await prisma.post.findMany({
            where: whereCondition,
            orderBy: { createdAt: 'desc' },
            include: {
                author: { select: { id: true, name: true, age: true } },
                _count: {
                    select: { likes: true, comments: true },
                },
            },
        });

        res.status(200).json(posts);
    } catch (err) {
        console.error('게시글 목록 조회 실패:', err);
        res.status(500).json({ message: '게시글 조회 실패', error: err.message });
    }
};

// 3. 게시글 상세 조회 (Read Post Detail) - 조회수 증가
exports.getPostDetail = async (req, res) => {
    const postId = parseInt(req.params.id);
    const userId = req.user ? req.user.userId : null;

    if (isNaN(postId)) {
        return res.status(400).json({ message: '유효하지 않은 게시글 ID입니다.' });
    }

    try {
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: {
                author: { select: { id: true, name: true, age: true } },
                likes: true, // 좋아요 정보 포함
                _count: { select: { likes: true, comments: true } },
            },
        });

        if (!post) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        // 미성년자 필터링 (상세 조회 시에도 적용)
        if (post.isAdultContent) {
            const user = userId ? await prisma.user.findUnique({ where: { id: userId }, select: { isMinor: true } }) : null;
            const isMinor = user ? user.isMinor : true; // 비회원은 미성년자로 간주

            if (isMinor) {
                // 성인 콘텐츠임을 알리고 차단
                return res.status(403).json({ message: '미성년자는 성인 콘텐츠를 조회할 수 없습니다.' });
            }
        }

        // 🚨 조회수 증가 로직 (이미 잘 구현되어 있었습니다!)
        await prisma.post.update({
            where: { id: postId },
            data: { views: { increment: 1 } },
        });

        res.status(200).json(post);
    } catch (error) {
        console.error('게시글 상세 조회 오류:', error);
        res.status(500).json({ message: '게시글 조회 중 서버 오류가 발생했습니다.' });
    }
};

// 4. 게시글 수정 (Update Post) - AI 필터 적용
exports.updatePost = async (req, res) => {
    try {
        const userId = req.user.userId;
        const postId = Number(req.params.id);
        const { title, content, visibility, imageUrl } = req.body;

        const post = await prisma.post.findUnique({ where: { id: postId } });

        if (!post) {
            return res.status(404).json({ message: '게시글 없음' });
        }
        if (post.authorId !== userId) {
            return res.status(403).json({ message: '수정 권한 없음' });
        }

        let updateData = {};

        if (title !== undefined) updateData.title = title;
        if (visibility !== undefined) updateData.visibility = visibility;
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

        if (content !== undefined) {
            // 텍스트 필터링 적용
            const { isAdultContent, filteredContent } = filterText(content);

            updateData.content = filteredContent;
            updateData.isAdultContent = isAdultContent;
        }

        const updatedPost = await prisma.post.update({
            where: { id: postId },
            data: updateData
        });

        res.json({ message: '게시글 수정 완료', post: updatedPost });
    } catch (err) {
        console.error('게시글 수정 실패:', err);
        res.status(500).json({ message: '게시글 수정 실패', error: err.message });
    }
};

// 5. 게시글 삭제 (Delete Post)
exports.deletePost = async (req, res) => {
    try {
        const userId = req.user.userId;
        const postId = Number(req.params.id);

        const post = await prisma.post.findUnique({ where: { id: postId } });

        if (!post) {
            return res.status(404).json({ message: '게시글 없음' });
        }
        if (post.authorId !== userId) {
            return res.status(403).json({ message: '삭제 권한 없음' });
        }

        await prisma.post.delete({ where: { id: postId } });

        res.json({ message: '게시글 삭제 완료' });
    } catch (err) {
        console.error('게시글 삭제 실패:', err);
        res.status(500).json({ message: '게시글 삭제 실패', error: err.message });
    }
};

// 6. 좋아요 토글 (Toggle Like)
exports.toggleLike = async (req, res) => {
    const userId = req.user.userId;
    const postId = parseInt(req.params.id);

    try {
        // 현재 좋아요 상태 확인 (userId와 postId를 복합 키로 사용)
        const existingLike = await prisma.like.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
        });

        let message;
        let liked;

        if (existingLike) {
            // 좋아요가 있으면 삭제 (취소)
            await prisma.like.delete({ where: { id: existingLike.id } });
            message = '좋아요 취소';
            liked = false;
        } else {
            // 좋아요가 없으면 생성 (좋아요)
            await prisma.like.create({ data: { userId, postId } });
            message = '좋아요 성공';
            liked = true;
        }

        // 변경된 좋아요 수 카운트
        const likeCount = await prisma.like.count({ where: { postId } });

        res.status(200).json({ message, liked, likeCount });
    } catch (error) {
        console.error('좋아요 처리 오류:', error);
        res.status(500).json({ message: '좋아요 처리 중 서버 오류가 발생했습니다.' });
    }
};