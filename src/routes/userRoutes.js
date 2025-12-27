const multer = require('multer');
const path = require('path');

// 🌟 이미지 저장 설정 (파일이 저장될 위치와 이름 규칙)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // 프로젝트 루트에 uploads 폴더가 있어야 함
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 6. 프로필 정보 수정 (이름 변경 및 프로필 이미지 업로드)
// 경로: PATCH /users/profile
router.patch('/profile', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name } = req.body;

        // 파일이 업로드되었다면 새 경로를, 없다면 유지
        const profileImage = req.file ? `/uploads/${req.file.filename}` : undefined;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(name && { name }), // name이 들어오면 업데이트
                ...(profileImage && { profileImage }) // 이미지가 들어오면 업데이트
            }
        });

        res.json({
            message: "프로필이 성공적으로 수정되었습니다.",
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                profileImage: updatedUser.profileImage
            }
        });
    } catch (error) {
        console.error("프로필 수정 에러:", error);
        res.status(500).json({ error: "프로필 수정 중 오류가 발생했습니다." });
    }
});