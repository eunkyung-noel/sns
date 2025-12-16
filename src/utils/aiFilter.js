const axios = require('axios');

// 1. Google Cloud Vision API 클라이언트 설정 (이미지)
// @google-cloud/vision 라이브러리가 필요함.
// Vision API는 클라이언트 초기화 시 자동으로 환경 변수 인증을 사용한다.
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const visionClient = new ImageAnnotatorClient();

// 2. Naver Clova Hate Speech API 정보 설정 (텍스트)
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const NAVER_API_URL = 'https://naveropenapi.apigw.ntruss.com/text/textclassification/v1/predict';


/**
 * 이미지 URL을 받아 유해성을 판단하고 성인 콘텐츠 플래그를 설정합니다.
 * @param {string} imageUrl - 검사할 이미지의 공개 URL
 * @returns {Promise<boolean>} 유해하면 true, 아니면 false
 */
exports.filterImage = async (imageUrl) => {
    if (!imageUrl) return false;

    try {
        const [result] = await visionClient.safeSearchDetection(imageUrl);
        const safeSearchResult = result.safeSearchAnnotation;

        // 유해 콘텐츠 판단 기준 (VISION API 점수 사용)
        // LIKELY 또는 VERY_LIKELY 일 경우 유해하다고 판단 (https://cloud.google.com/vision/docs/reference/rest/v1/SafeSearchAnnotation)
        const isAdult = safeSearchResult.adult === 'LIKELY' || safeSearchResult.adult === 'VERY_LIKELY';
        const isViolence = safeSearchResult.violence === 'LIKELY' || safeSearchResult.violence === 'VERY_LIKELY';

        // 성인 또는 폭력 콘텐츠가 감지되면 true 반환
        return isAdult || isViolence;

    } catch (error) {
        console.error('Google Vision API 오류 (이미지 필터링 실패):', error.message);
        // API 오류 시에는 안전을 위해 필터링하지 않고 통과시킵니다. (로그는 남겨야 함)
        return false;
    }
};

//  텍스트 필터링 (Naver Clova Hate Speech API)

/**
 * 텍스트 내용의 유해성을 판단하고 필터링합니다.
 * @param {string} content - 게시글 또는 댓글 내용
 * @returns {Promise<{ isAdultContent: boolean, filteredContent: string }>}
 */
exports.filterText = async (content) => {
    let isAdult = false;
    let filteredContent = content;

    // API 키가 없으면 더미 로직만 실행 (실제 배포 시에는 반드시 키 필요)
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
        // 임시/더미 로직: '성인'이나 '나쁜말'이 포함되면 더미 필터링
        if (content.includes('성인') || content.includes('19금')) {
            isAdult = true;
        }
        filteredContent = content.replace(/욕설|나쁜말/gi, '[블러처리됨]');
        return { isAdultContent: isAdult, filteredContent };
    }

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

        const { confidence, predictions } = response.data;
        const hatePrediction = predictions.find(p => p.label === 'hate');

        // 혐오 표현 점수가 0.9 이상이거나 (매우 확실)
        // 일반적인 악성 표현 점수가 0.9 이상이면 블러 처리 및 성인 콘텐츠 플래그 설정
        if (hatePrediction && (hatePrediction.confidence >= 0.9 || confidence.general >= 0.9)) {
            isAdult = true;
            // 실제 구현에서는 유해 부분을 찾아 대체해야 하지만, 여기서는 전체를 블러 처리 가정
            filteredContent = content.replace(content, '[AI 필터링된 유해 콘텐츠]');
        }

        return { isAdultContent: isAdult, filteredContent: filteredContent };

    } catch (error) {
        console.error('Naver Clova API 오류 (텍스트 필터링 실패):', error.message);
        // API 오류 시 원래 콘텐츠를 반환 (안전하게 처리되도록 보장)
        return { isAdultContent: false, filteredContent: content };
    }
};