import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VscAdd, VscFolderOpened, VscAccount, VscSignOut } from "react-icons/vsc";
import { getMyWorkspacesApi, getUserProfileApi } from '../utils/api';
import { useAuth } from '../utils/AuthContext'; // 💡 로그아웃 처리를 위해 가져옵니다

export default function Dashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth(); // 💡 AuthContext 활용
    
    const [workspaces, setWorkspaces] = useState([]);
    const [userProfile, setUserProfile] = useState(null); // 유저 정보 상태 추가
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // 💡 1. 현재 로그인한 유저의 정보(닉네임, 이메일)를 가져옵니다.
            if (user && user.id) {
                const profile = await getUserProfileApi(user.id);
                setUserProfile(profile);
            }
            
            // 💡 2. 워크스페이스 목록을 가져옵니다.
            const list = await getMyWorkspacesApi();
            setWorkspaces(list || []);
        } catch (e) {
            console.error("데이터 로드 실패: ", e);
        } finally {
            setLoading(false);
        }
    };

    const handleEnter = (ws) => {
        const targetId = ws.uuid || ws.id || ws.workspaceId;
        const isTeam = ws.type === 'TEAM';

        if (isTeam) {
            navigate(`/workspace/team/${targetId}`);
        } else {
            navigate(`/workspace/personal/${targetId}`);
        }
    };

    // 💡 로그아웃 처리 함수
    const handleLogout = () => {
        if(window.confirm("정말 로그아웃 하시겠습니까?")) {
            logout(); // 로컬스토리지 토큰 삭제 및 상태 변경
            navigate('/login'); // 로그인 화면으로 쫓아냅니다
        }
    };

    return (
        <div className="min-h-screen bg-[#1e1e1e] text-gray-300 p-10 font-sans">
            {/* 💡 헤더 영역 (프로필 & 로그아웃 버튼 추가) */}
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <span className="text-blue-500">WebIDE</span> Dashboard
                </h1>
                
                {userProfile && (
                    <div className="flex items-center gap-6 bg-[#252526] px-5 py-2.5 rounded-full border border-[#333]">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                <VscAccount size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-white leading-tight">{userProfile.nickname}</span>
                                <span className="text-xs text-gray-500 leading-tight">{userProfile.email}</span>
                            </div>
                        </div>
                        <div className="w-px h-8 bg-gray-700"></div> {/* 구분선 */}
                        <button 
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-red-400 transition-colors"
                        >
                            <VscSignOut size={18} />
                            <span>로그아웃</span>
                        </button>
                    </div>
                )}
            </div>

            {/* 메인 콘텐츠 영역 */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <div 
                    onClick={() => navigate('/new')}
                    className="border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center h-40 cursor-pointer hover:border-blue-500 hover:text-blue-500 transition group"
                >
                    <VscAdd className="text-4xl mb-2 text-gray-500 group-hover:text-blue-500 transition-colors" />
                    <span className="font-semibold">New Workspace</span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-40 text-gray-500 font-bold">Loading...</div>
                ) : workspaces.map(ws => {
                    const targetId = ws.uuid || ws.id || ws.workspaceId;
                    const isTeam = ws.type === 'TEAM';

                    return (
                        <div 
                            key={targetId}
                            onClick={() => handleEnter(ws)}
                            className="bg-[#252526] rounded-lg p-5 border border-[#333] shadow-lg cursor-pointer hover:bg-[#2a2d2e] hover:border-blue-500 transition relative group"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <VscFolderOpened className="text-yellow-500 text-2xl" />
                                <h3 className="text-lg font-bold text-white truncate">{ws.name}</h3>
                            </div>
                            <p className="text-xs text-gray-500 font-mono">
                                ID: {(targetId || "00000000").substring(0, 13)}...
                            </p>
                            <div className="flex justify-between items-center mt-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isTeam ? 'bg-blue-900/50 text-blue-400' : 'bg-gray-800 text-gray-400'}`}>
                                    {isTeam ? 'TEAM' : 'SOLO'}
                                </span>
                                <div className="opacity-0 group-hover:opacity-100 transition text-blue-400 text-sm font-bold">
                                    Open &rarr;
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}