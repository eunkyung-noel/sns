/**
 * 이미지 유해성 검사 함수 (시뮬레이션)
 */
const checkImageSafe = async (imagePath) => {
    // 실제 구현 시에는 여기서 외부 AI API를 호출합니다.
    // 임시로 모든 이미지를 안전함(true)으로 처리합니다.
    return { isSafe: true, reason: null };
};

module.exports = { checkImageSafe };
