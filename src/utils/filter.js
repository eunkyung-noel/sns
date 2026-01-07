const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

exports.filterContent = async (content) => {
    // [자동 장치] AI를 부르기 전에도 코드단에서 즉시 치환 (0.001초 소요)
    const badWords = /ㅅㅂ|시발|ㅂㅅ|병신|새끼|존나|미친/g;
    let autoFiltered = content.replace(badWords, "🫧🫧🫧🫧");

    try {
        // API 키가 없으면 자동으로 코드단 치환 결과 반환
        if (!process.env.GEMINI_API_KEY) {
            return { isSafe: false, filteredContent: autoFiltered };
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `입력 문장에 비속어가 있다면 해당 단어만 '🫧🫧🫧🫧'로 정화하여 문장만 출력해.
        문장: "${content}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        // AI가 정화한 텍스트에 비속어가 남아있을 경우를 대비한 2차 자동 정화
        const finalContent = text.replace(badWords, "🫧🫧🫧🫧");

        return {
            isSafe: content === finalContent,
            filteredContent: finalContent
        };

    } catch (error) {
        // 에러 발생 시에도 자동으로 정화된 내용 반환
        return { isSafe: false, filteredContent: autoFiltered };
    }
};