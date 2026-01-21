import axios from 'axios';

const api = axios.create({
    // [교정] 상대 경로 '/api'는 프론트 서버로 요청을 보냅니다.
    // 백엔드 포트인 5001번을 정확히 지정해야 합니다.
    baseURL: 'http://localhost:5001/api',
});

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

api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("📡 API 통신 에러 발생:", {
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });
        return Promise.reject(error);
    }
);

export default api;