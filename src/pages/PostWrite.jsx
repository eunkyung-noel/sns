const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        Swal.fire('오류', '로그인 토큰이 없습니다. 다시 로그인하세요.', 'error');
        return navigate('/login');
    }

    if (!content.trim()) return Swal.fire('알림', '내용을 입력해주세요.', 'warning');

    setLoading(true);
    const formData = new FormData();
    formData.append('content', content);
    if (image) {
        formData.append('image', image);
        // 백엔드에서 isSafe 필드를 기대한다면 추가
        formData.append('isSafe', String(!isNSFW));
    }

    try {
        // ✅ 교정: baseURL(/api)이 이미 설정되어 있으므로 '/posts'만 적어야 합니다.
        await api.post('/posts', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        Swal.fire({ icon: 'success', title: '발사 성공!', timer: 1500, showConfirmButton: false });
        navigate('/feed');
    } catch (err) {
        console.error("게시글 업로드 실패:", err.response?.data);

        const status = err.response?.status;
        const serverMsg = err.response?.data?.message || "서버 응답 없음";

        if (status === 401) {
            Swal.fire('인증 만료', '다시 로그인 해주세요.', 'error');
            navigate('/login');
        } else {
            Swal.fire({
                icon: 'error',
                title: '업로드 실패',
                html: `에러 코드: <b>${status}</b><br/>원인: ${serverMsg}`
            });
        }
    } finally {
        setLoading(false);
    }
};