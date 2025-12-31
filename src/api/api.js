import axios from 'axios';

const api = axios.create({
    // ✅ AWS 탄력적 IP와 백엔드 포트(5001) 반영 완료
    baseURL: 'http://3.35.170.66:5001/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("서버 응답 에러:", error.response?.status, error.response?.data);
        return Promise.reject(error);
    }
);

export default api;