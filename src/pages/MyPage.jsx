import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import api from '../api/api';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const MyPage = () => {
    const [user, setUser] = useState(null);
    const [myPosts, setMyPosts] = useState([]);
    const [myReports, setMyReports] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [viewMode, setViewMode] = useState('posts'); // 'posts' or 'reports'
    const [loading, setLoading] = useState(true);

    const [editData, setEditData] = useState({ nickname: '', bio: '', language: 'ko' });
    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

    // ✅ 내 ID: 비교 안전성을 위해 String 변환
    const myId = localStorage.getItem('userId') ? String(localStorage.getItem('userId')) : null;

    const fetchData = async () => {
        try {
            setLoading(true);
            const [userRes, postsRes, reportRes] = await Promise.all([
                api.get('/auth/me'),
                api.get('/posts'),
                api.get('/posts/reports/my').catch(() => ({ data: [] }))
            ]);

            const userData = userRes.data.user || userRes.data;
            const allPosts = Array.isArray(postsRes.data) ? postsRes.data : [];
            const reports = Array.isArray(reportRes.data) ? reportRes.data : [];

            if (userData && userData.id) {
                setUser(userData);
                setEditData({
                    nickname: userData.nickname || '',
                    bio: userData.bio || '',
                    language: userData.language || 'ko'
                });

                const filtered = allPosts.filter(p =>
                    String(p.authorId || p.userId) === String(userData.id)
                );
                setMyPosts(filtered);
                setMyReports(reports);
            }
        } catch (err) {
            console.error("데이터 로딩 실패:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // ✅ 좋아요 토글 (구조 파악 및 낙관적 업데이트 수정)
    const handleLike = async (e, postId) => {
        e.stopPropagation();
        e.preventDefault();

        if (!myId) return;

        setMyPosts(prev => prev.map(p => {
            if (String(p.id) === String(postId)) {
                const currentLikes = p.likes || [];
                // 객체 형태 {userId: '...'} 인지 확인하여 비교
                const isLiked = currentLikes.some(l =>
                    String(typeof l === 'object' ? l.userId : l) === myId
                );

                const newLikes = isLiked
                    ? currentLikes.filter(l => String(typeof l === 'object' ? l.userId : l) !== myId)
                    : [...currentLikes, { userId: myId, postId: postId }];

                return { ...p, likes: newLikes };
            }
            return p;
        }));

        try {
            await api.post(`/posts/${postId}/like`);
        } catch (err) {
            console.error("좋아요 실패:", err);
            fetchData();
        }
    };

    const getFullImageUrl = (path) => {
        if (!path) return null;
        return path.startsWith('http') ? path : `${SERVER_URL}${path.startsWith('/') ? path : `/${path}`}`;
    };

    if (loading) return <Loading>🫧 로딩 중...</Loading>;
    if (!user) return null;

    return (
        <Container>
            <ProfileSection>
                <AvatarWrapper onClick={() => isEditing && fileInputRef.current.click()}>
                    <Avatar src={user.profilePic ? getFullImageUrl(user.profilePic) : `https://ui-avatars.com/api/?name=${user.nickname}&background=74b9ff&color=fff`} />
                    {isEditing && <Overlay>변경</Overlay>}
                    <input type="file" ref={fileInputRef} hidden accept="image/*" />
                </AvatarWrapper>
                <InfoWrapper>
                    <div className="name-row">
                        <h2>@{user.nickname}</h2>
                        <BtnGroup>
                            <GrayBtn onClick={() => setIsEditing(!isEditing)}>
                                {isEditing ? '취소' : '편집'}
                            </GrayBtn>
                            <GrayBtn onClick={() => setViewMode(viewMode === 'posts' ? 'reports' : 'posts')}>
                                {viewMode === 'posts' ? '🚨 신고 기록' : '🖼️ 게시물 보기'}
                            </GrayBtn>
                        </BtnGroup>
                    </div>
                    <StatsRow>
                        <StatItem>게시물 <b>{myPosts.length}</b></StatItem>
                        <StatItem>신고 <b>{myReports.length}</b></StatItem>
                        <StatItem>팔로워 <b>{user.followers?.length || 0}</b></StatItem>
                    </StatsRow>
                    <p className="bio">{user.bio || "자기소개가 비어있습니다."}</p>
                </InfoWrapper>
            </ProfileSection>

            <SectionDivider>
                {viewMode === 'posts' ? '내 게시물' : '내 신고 내역'}
            </SectionDivider>

            {viewMode === 'posts' ? (
                <Grid>
                    {myPosts.length > 0 ? (
                        myPosts.map(p => {
                            // ✅ 여기서도 객체 구조 체크 필수
                            const isLiked = (p.likes || []).some(l =>
                                String(typeof l === 'object' ? l.userId : l) === myId
                            );
                            return (
                                <PostItem key={p.id} onClick={() => navigate(`/post/${p.id}`)}>
                                    {p.imageUrl ? (
                                        <img src={getFullImageUrl(p.imageUrl)} alt="" />
                                    ) : (
                                        <NoImgText>{p.content?.substring(0, 15)}...</NoImgText>
                                    )}
                                    <PostOverlay>
                                        <OverlayItem
                                            onClick={(e) => handleLike(e, p.id)}
                                            $active={isLiked}
                                        >
                                            <span className="icon">{isLiked ? '❤️' : '🤍'}</span>
                                            <b className="count">{p.likes?.length || 0}</b>
                                        </OverlayItem>
                                        <OverlayItem>
                                            <span className="icon">💬</span>
                                            <b className="count">{p.comments?.length || 0}</b>
                                        </OverlayItem>
                                    </PostOverlay>
                                </PostItem>
                            );
                        })
                    ) : (
                        <EmptyMsg>작성한 게시물이 없습니다.</EmptyMsg>
                    )}
                </Grid>
            ) : (
                <ReportList>
                    {myReports.length === 0 ? <EmptyMsg>신고 내역이 없습니다.</EmptyMsg> :
                        myReports.map((report, idx) => (
                            <ReportItem key={report.id || idx}>
                                <div className="header">
                                    <span className="badge">처리중</span>
                                    <span className="date">{new Date(report.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="reason">사유: {report.reason}</div>
                                <div className="target">
                                    대상: {report.targetPost ? `게시글 #${report.targetPost.id}` : '댓글'}
                                </div>
                            </ReportItem>
                        ))
                    }
                </ReportList>
            )}
        </Container>
    );
};

const Container = styled.div`max-width: 600px; margin: 0 auto; padding: 40px 20px;`;
const ProfileSection = styled.div`display: flex; gap: 30px; margin-bottom: 30px;`;
const AvatarWrapper = styled.div`width: 90px; height: 90px; border-radius: 50%; overflow: hidden; position: relative; cursor: pointer; border: 1px solid #eee; flex-shrink: 0;`;
const Avatar = styled.img`width: 100%; height: 100%; object-fit: cover;`;
const Overlay = styled.div`position: absolute; inset: 0; background: rgba(0,0,0,0.4); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px;`;
const InfoWrapper = styled.div`flex: 1; .name-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; } h2 { margin: 0; font-size: 20px; } .bio { color: #666; font-size: 14px; margin-top: 5px; }`;
const BtnGroup = styled.div`display: flex; gap: 8px;`;
const GrayBtn = styled.button`background: #efefef; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; &:hover { background: #e0e0e0; }`;
const StatsRow = styled.div`display: flex; gap: 20px; margin-bottom: 10px;`;
const StatItem = styled.div`font-size: 14px; b { font-weight: 700; margin-left: 4px; }`;
const SectionDivider = styled.div`border-top: 1px solid #eee; padding: 15px 0; margin-top: 10px; text-align: center; font-weight: bold; font-size: 14px; color: #888; letter-spacing: 1px;`;
const Grid = styled.div`display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px;`;
const PostItem = styled.div` aspect-ratio: 1/1; background: #f8f9fa; position: relative; cursor: pointer; img { width: 100%; height: 100%; object-fit: cover; } &:hover > div { display: flex; } `;
const PostOverlay = styled.div` position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: none; align-items: center; justify-content: center; gap: 20px; color: white; `;

// ✅ 하트 색상 변경을 위해 $active 프롭 사용 및 내부 요소 색상 강제 지정
const OverlayItem = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: transform 0.1s ease;

    .icon {
        font-size: 20px;
        filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));
    }

    .count {
        font-weight: bold;
        text-shadow: 0 0 4px rgba(0,0,0,0.8);
        /* ✅ 활성화 상태일 때 글자색을 빨간색으로 변경 */
        color: ${props => props.$active ? '#ff4757' : '#ffffff'};
    }

    &:hover {
        transform: scale(1.1);
    }
`;

const NoImgText = styled.div`display: flex; align-items: center; justify-content: center; height: 100%; font-size: 12px; color: #aaa; background: #eee; text-align: center; padding: 10px;`;
const Loading = styled.div`display: flex; align-items: center; justify-content: center; height: 80vh; color: #74b9ff; font-weight: bold;`;
const EmptyMsg = styled.div`grid-column: span 3; text-align: center; padding: 60px 0; color: #ccc; font-size: 14px;`;
const ReportList = styled.div`display: flex; flex-direction: column; gap: 12px;`;
const ReportItem = styled.div`padding: 16px; border: 1px solid #eee; border-radius: 8px; background: #fff; .header { display: flex; justify-content: space-between; margin-bottom: 8px; } .badge { background: #ffeb3b; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; } .date { font-size: 12px; color: #999; } .reason { font-weight: bold; margin-bottom: 4px; } .target { font-size: 12px; color: #666; }`;

export default MyPage;