import axios from 'axios';

const api = axios.create({
    // 기존 localhost에서 AWS 퍼블릭 IP로 변경되었습니다.
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
        // 자동 이동(window.location)을 완전히 제거하여 튕김 현상 방지
        console.error("서버 응답 에러:", error.response?.status, error.response?.data);
        return Promise.reject(error);
    }
);

export default api;