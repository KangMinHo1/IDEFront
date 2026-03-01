import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VscAdd, VscFolderOpened } from "react-icons/vsc";
import { createWorkspaceApi, getMyWorkspacesApi } from '../utils/api';
import CreateWorkspaceModal from './CreateWorkspaceModal';

export default function Dashboard() {
    const navigate = useNavigate();
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadWorkspaces();
    }, []);

    const loadWorkspaces = async () => {
        try {
            const list = await getMyWorkspacesApi();
            setWorkspaces(list);
        } catch (e) {
            alert("목록 로드 실패: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubmit = async (name, path, desc) => {
        try {
            await createWorkspaceApi(name, path);
            loadWorkspaces();
        } catch (e) {
            alert("생성 실패: " + e.message);
        }
    };

    const handleEnter = (id) => {
        navigate(`/workspace/${id}`);
    };

    return (
        <div className="min-h-screen bg-[#1e1e1e] text-gray-300 p-10 font-sans">
            <h1 className="text-3xl font-bold mb-8 text-white flex items-center gap-3">
                <span className="text-blue-500">WebIDE</span> Dashboard
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <div 
                    onClick={() => setIsModalOpen(true)}
                    className="border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center h-40 cursor-pointer hover:border-blue-500 hover:text-blue-500 transition"
                >
                    <VscAdd className="text-4xl mb-2" />
                    <span className="font-semibold">New Workspace</span>
                </div>

                {loading ? (
                    <div>Loading...</div>
                ) : workspaces.map(ws => (
                    <div 
                        key={ws.uuid}
                        onClick={() => handleEnter(ws.uuid)}
                        className="bg-[#252526] rounded-lg p-5 border border-[#333] shadow-lg cursor-pointer hover:bg-[#2a2d2e] hover:border-blue-500 transition relative group"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <VscFolderOpened className="text-yellow-500 text-2xl" />
                            <h3 className="text-lg font-bold text-white truncate">{ws.name}</h3>
                        </div>
                        <p className="text-xs text-gray-500">UUID: {ws.uuid.substring(0, 8)}...</p>
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition text-blue-400 text-sm">
                            Open &rarr;
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <CreateWorkspaceModal 
                    onClose={() => setIsModalOpen(false)} 
                    onCreate={handleCreateSubmit} 
                />
            )}
        </div>
    );
}