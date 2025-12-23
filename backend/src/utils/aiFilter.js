const axios = require('axios');
const { ImageAnnotatorClient } = require('@google-cloud/vision');

/**
 * 1. Google Cloud Vision API 클라이언트 설정
 * 로컬 테스트 시 GOOGLE_APPLICATION_CREDENTIALS 환경 변수에 key.json 경로가 설정되어 있어야 합니다.
 */
const visionClient = new ImageAnnotatorClient();

/**
 * 2. Naver Clova Hate Speech API 정보 설정
 */
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const NAVER_API_URL = 'https://naveropenapi.apigw.ntruss.com/text/textclassification/v1/predict';

/**
 * 이미지 유해성 필터링 (Google Vision)
 * @param {string} imageUrl - 검사할 이미지의 URL
 * @returns {boolean} - 유해 이미지 여부 (true: 유해함, false: 안전함)
 */
exports.filterImage = async (imageUrl) => {
    if (!imageUrl) return false;
    try {
        // Google Vision API 호출
        const [result] = await visionClient.safeSearchDetection(imageUrl);
        const safe = result.safeSearchAnnotation;

        // 결과 로그 출력 (디버깅용)
        console.log(`[이미지 분석 결과]: Adult: ${safe.adult}, Violence: ${safe.violence}`);

        // 성인물(adult), 폭력성(violence) 판정
        // LIKELY(확률 높음) 또는 VERY_LIKELY(확률 매우 높음)일 경우 유해한 것으로 간주
        const isAdult = safe.adult === 'LIKELY' || safe.adult === 'VERY_LIKELY';
        const isViolence = safe.violence === 'LIKELY' || safe.violence === 'VERY_LIKELY';

        return isAdult || isViolence;
    } catch (error) {
        console.error('Google Vision API 오류:', error.message);
        // API 호출 실패 시 보안을 위해 true(차단)로 설정하거나, 운영 편의를 위해 false(통과)로 설정 가능
        return false;
    }
};

/**
 * 텍스트 유해성 필터링 (정규식 + Naver Clova)
 * @param {string} content - 검사할 텍스트 본문
 * @returns {object} - { isAdultContent: 유해여부, filteredContent: 변환된 텍스트 }
 */
exports.filterText = async (content) => {
    if (!content) return { isAdultContent: false, filteredContent: "" };

    let isAdultContent = false;
    let filteredContent = content;

    /**
     * 1단계: 정규표현식 비속어 치환 (로컬 필터링)
     * 초성, 변칙 기호 포함 강화된 정규식
     */
    const toxicWords = /ㅅㅂ|시발|씨발|씨빨|시빨|ㅅ\.ㅂ|ㅅ_ㅂ|ㅅ\!ㅂ|시~발|ㅈㄴ|존나|좆|ㅈㄱㄴ|미친|미칭|개새끼|개새|병신|븅신|ㅄ|凸|씨부랄|지랄|ㅉㅉ|엠창|니애미|닥쳐/gi;
    filteredContent = content.replace(toxicWords, '[비속어 처리됨]');

    /**
     * 2단계: 특정 성인 키워드 강제 체크
     */
    const adultKeywords = ['성인', '19금', '조건만남', '섹스'];
    if (adultKeywords.some(keyword => content.includes(keyword))) {
        isAdultContent = true;
    }

    /**
     * 3단계: Naver API 키가 없는 경우 여기서 조기 반환
     */
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
        return { isAdultContent, filteredContent };
    }

    /**
     * 4단계: Naver Clova AI 정밀 분석 (혐오 표현 탐지)
     */
    try {
        const response = await axios.post(
            NAVER_API_URL,
            { content: content },
            {
                headers: {
                    'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID,
                    'X-NCP-APIGW-API-KEY': NAVER_CLIENT_SECRET,
                    'Content-Type': 'application/json',
                },
            }
        );

        const { predictions } = response.data;
        const hatePrediction = predictions.find(p => p.label === 'hate');

        // AI가 90% 이상의 확률로 혐오 표현(hate)이라고 판단하면 전체 블러 처리
        if (hatePrediction && hatePrediction.confidence >= 0.9) {
            isAdultContent = true;
            filteredContent = '[AI 필터링된 유해 콘텐츠]';
        }

        return { isAdultContent, filteredContent };
    } catch (error) {
        console.error('Naver Clova API 오류:', error.message);
        return { isAdultContent, filteredContent };
    }
};