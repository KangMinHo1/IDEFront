import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VscAdd, VscFolderOpened, VscAccount, VscSignOut, VscMail } from "react-icons/vsc";
import { 
    getMyWorkspacesApi, 
    getUserProfileApi,
    fetchPendingInvitationsApi,     // 💡 신규 API
    acceptWorkspaceInvitationApi,   // 💡 신규 API
    rejectWorkspaceInvitationApi    // 💡 신규 API
} from '../utils/api';
import { useAuth } from '../utils/AuthContext'; 

export default function Dashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth(); 
    
    const [workspaces, setWorkspaces] = useState([]);
    const [invitations, setInvitations] = useState([]); // 💡 초대장 목록 상태 추가
    const [userProfile, setUserProfile] = useState(null); 
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            if (user && user.id) {
                const profile = await getUserProfileApi(user.id);
                setUserProfile(profile);

                // 💡 [NEW] 초대장 목록 가져오기
                const invList = await fetchPendingInvitationsApi(user.id);
                setInvitations(invList || []);
            }
            
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

    const handleLogout = () => {
        if(window.confirm("정말 로그아웃 하시겠습니까?")) {
            logout(); 
            navigate('/login'); 
        }
    };

    // 💡 [NEW] 초대 수락 처리
    const handleAcceptInvite = async (workspaceId) => {
        try {
            await acceptWorkspaceInvitationApi(workspaceId, user.id);
            alert("초대를 수락했습니다! 이제 워크스페이스에 참여할 수 있습니다.");
            loadDashboardData(); // 화면(초대장 및 워크스페이스 목록) 새로고침
        } catch (e) {
            alert("수락 실패: " + e.message);
        }
    };

    // 💡 [NEW] 초대 거절 처리
    const handleRejectInvite = async (workspaceId) => {
        if (!window.confirm("정말 이 초대를 거절하시겠습니까?")) return;
        try {
            await rejectWorkspaceInvitationApi(workspaceId, user.id);
            alert("초대를 거절했습니다.");
            loadDashboardData(); // 화면 새로고침
        } catch (e) {
            alert("거절 실패: " + e.message);
        }
    };

    return (
        <div className="min-h-screen bg-[#1e1e1e] text-gray-300 p-10 font-sans">
            {/* 헤더 영역 */}
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
                        <div className="w-px h-8 bg-gray-700"></div>
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

            {/* 💡 [NEW] 대기 중인 초대장 섹션 (초대장이 있을 때만 보임) */}
            {invitations.length > 0 && (
                <div className="mb-10 animate-fade-in-up">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <VscMail className="text-indigo-400" size={22} /> 대기 중인 초대 ({invitations.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {invitations.map(inv => (
                            <div key={inv.workspaceId} className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                <div>
                                    <h3 className="text-[16px] font-bold text-white truncate">{inv.workspaceName}</h3>
                                    <p className="text-[12px] text-indigo-200/70 mt-1">팀 워크스페이스에 초대되었습니다.</p>
                                </div>
                                <div className="flex gap-2 mt-1">
                                    <button 
                                        onClick={() => handleAcceptInvite(inv.workspaceId)}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-sm font-bold transition shadow-sm"
                                    >
                                        참여하기
                                    </button>
                                    <button 
                                        onClick={() => handleRejectInvite(inv.workspaceId)}
                                        className="flex-1 bg-[#333] hover:bg-[#444] text-gray-300 py-2 rounded-lg text-sm font-bold transition border border-gray-700"
                                    >
                                        거절
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 메인 워크스페이스 콘텐츠 영역 */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <div 
                    onClick={() => navigate('/new')}
                    className="border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center h-40 cursor-pointer hover:border-blue-500 hover:text-blue-500 transition group bg-[#252526]/50"
                >
                    <VscAdd className="text-4xl mb-2 text-gray-500 group-hover:text-blue-500 transition-colors" />
                    <span className="font-semibold text-sm">New Workspace</span>
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
                                <div className="opacity-0 group-hover:opacity-100 transition text-blue-400 text-sm font-bold flex items-center gap-1">
                                    Open <span>&rarr;</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}