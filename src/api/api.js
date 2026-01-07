import axios from 'axios';

const api = axios.create({
    // ✅ 서버 server.js 설정에 맞춰 /api를 반드시 포함해야 합니다.
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
});

// 요청 인터셉터: 모든 요청에 토큰 주입
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 응답 인터셉터: 에러 처리 및 상세 로그
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const data = error.response?.data;

        console.error("📡 API 통신 에러 발생:", {
            url: error.config?.url,
            status,
            data,
            message: error.message,
        });

        if (status === 401) {
            console.warn("인증 만료 – 다시 로그인 필요");
            // 선택 사항: 로그인 페이지로 리다이렉트
            // localStorage.clear();
            // window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default api;