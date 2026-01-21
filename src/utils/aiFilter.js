const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * [Fact] Gemini 1.5 Flash 모델 사용
 * 별도의 JSON 키 파일 없이 API_KEY만으로 동작합니다.
 */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Gemini AI 통합 필터링 (텍스트 + 이미지)
 * @param {string} content - 게시글 텍스트
 * @param {string} imageBase64 - 분석할 이미지의 Base64 문자열 (optional)
 * @returns {object} - { isSafe: 안전여부, filteredContent: 변환된 텍스트 }
 */
exports.filterContent = async (content, imageBase64) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // [Fact] AI에게 검열 기준과 출력 형식을 엄격히 제한함
        let prompt = `
            Analyze the following social media content for safety.
            Criteria: profanity, hate speech, sexual content, or violence.
            
            1. If the content is inappropriate, reply only with the word "Unsafe".
            2. If the content is safe, reply only with the word "Safe".
            
            Do not provide any other text or explanation.
        `;

        const parts = [prompt];

        // 텍스트가 있으면 프롬프트에 추가
        if (content) {
            parts.push(`Text to analyze: "${content}"`);
        }

        // 이미지가 있으면 분석 데이터에 추가
        if (imageBase64) {
            parts.push({
                inlineData: {
                    data: imageBase64,
                    mimeType: "image/jpeg", // [Fact] 일반적인 이미지 타입 설정
                },
            });
        }

        // 분석 결과 요청
        const result = await model.generateContent(parts);
        const response = await result.response;
        const safetyResult = response.text().trim().toLowerCase();

        // [Fact] Gemini가 'Unsafe'라고 판단하면 차단 처리
        const isSafe = !safetyResult.includes("unsafe");

        return {
            isSafe: isSafe,
            // [Opinion] Gemini를 통한 텍스트 치환보다 전체 블러 처리가 보안상 유리하므로 원문 유지
            filteredContent: isSafe ? content : "[AI에 의해 차단된 콘텐츠]"
        };

    } catch (error) {
        console.error('Gemini API 필터링 오류:', error.message);
        // [Fact] API 장애 시 서비스 중단을 막기 위해 '안전'으로 간주하여 통과
        return { isSafe: true, filteredContent: content };
    }
};