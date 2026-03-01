// src/components/CodeMap.jsx
import React, { useMemo, useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ReactFlow, { Background, Controls, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import { 
    VscClose, VscGoToFile, VscWarning, VscEdit, VscFolder, VscFile, 
    VscBeaker, VscPlay, VscPass, VscError, VscRefresh 
} from "react-icons/vsc";
import { closeCodeMap, setActiveActivity } from '../store/slices/uiSlice'; 
import { setActiveFile } from '../store/slices/fileSystemSlice'; 

// =========================================================
// 💡 커스텀 노드 디자인
// =========================================================
const CustomNode = ({ data }) => {
    const isGeneral = data.role === 'file' || data.isFolder;
    
    let roleColor = "text-gray-500";
    let borderStyle = "border-gray-200";
    let displayRole = "FILE";
    let subtitle = "General File";

    if (data.role === 'controller') {
        displayRole = "CONTROLLER"; roleColor = "text-blue-500";
        borderStyle = "border-blue-400 ring-4 ring-blue-50"; subtitle = "REST Endpoints";
    } else if (data.role === 'service') {
        displayRole = "SERVICE"; roleColor = "text-green-500";
        borderStyle = "border-green-400 ring-4 ring-green-50"; subtitle = "Business Logic";
    } else if (data.role === 'db') {
        displayRole = "REPOSITORY"; roleColor = "text-purple-500";
        borderStyle = "border-purple-400 ring-4 ring-purple-50"; subtitle = "Data Access Layer";
    } else if (data.role === 'entity') {
        displayRole = "ENTITY"; roleColor = "text-orange-500";
        borderStyle = "border-orange-300 ring-4 ring-orange-50"; subtitle = "Domain Model";
    } else if (data.isFolder) {
        displayRole = "DIRECTORY"; subtitle = "Folder";
    }

    let statusEffect = "";
    if (data.status === 'error') { borderStyle = "border-red-500"; statusEffect = "ring-4 ring-red-100 animate-pulse"; } 
    else if (data.status === 'editing') { borderStyle = "border-blue-500"; statusEffect = "ring-4 ring-blue-100 animate-pulse"; }

    const cardPadding = isGeneral ? "px-4 py-3" : "px-6 py-5";
    const cardWidth = isGeneral ? "min-w-[180px]" : "min-w-[240px]";
    const titleSize = isGeneral ? "text-[13px]" : "text-[16px]";

    return (
        <div className="flex flex-col items-center group cursor-pointer">
            {data.showLayerLabel && (
                <div className={`text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest transition-opacity opacity-100`}>
                    {data.layerName}
                </div>
            )}
            
            <div className={`relative ${cardPadding} bg-white rounded-xl border-2 ${borderStyle} ${statusEffect} shadow-[0_4px_15px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)] ${cardWidth} text-center transition-all duration-300`}>
                <Handle type="target" position={Position.Top} className="opacity-0 w-full h-1 top-0" />
                
                {data.status === 'error' && <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-bounce"/>}
                {data.status === 'editing' && <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-bounce"/>}

                <div className={`text-[9px] font-extrabold ${roleColor} uppercase tracking-widest mb-1`}>{displayRole}</div>
                <div className={`${titleSize} font-bold text-gray-900 mb-0.5 truncate`}>
                    {data.label.replace('.java', '').replace('.js', '').replace('.py', '')}
                </div>
                
                {!isGeneral && (
                    <div className="text-[11px] text-gray-400 font-medium mt-1.5">
                        {data.apiCount > 0 ? <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">{data.apiCount} APIs</span> : subtitle}
                    </div>
                )}

                <Handle type="source" position={Position.Bottom} className="opacity-0 w-full h-1 bottom-0" />
            </div>
        </div>
    );
};

const nodeTypes = { custom: CustomNode };

export default function CodeMap() {
    const dispatch = useDispatch();
    const { tree, fileContents } = useSelector(state => state.fileSystem);
    const { codeMapMode } = useSelector(state => state.ui);

    const isSplit = codeMapMode === 'split';
    
    // 상태 관리
    const [selectedNode, setSelectedNode] = useState(null); 
    const [selectedApi, setSelectedApi] = useState(null);
    const [reqBody, setReqBody] = useState('');
    const [resData, setResData] = useState(null);
    const [resStatus, setResStatus] = useState(null);
    const [isTesting, setIsTesting] = useState(false);

    // API 자동 스캔
    const apiEndpoints = useMemo(() => {
        const endpoints = [];
        Object.entries(fileContents || {}).forEach(([path, content]) => {
            const regex = /@(Get|Post|Put|Delete|Patch)Mapping\s*\(\s*["']([^"']+)["']\s*\)/gi;
            let match;
            while ((match = regex.exec(content)) !== null) {
                endpoints.push({ method: match[1].toUpperCase(), path: match[2], fullPath: path });
            }
        });
        return endpoints;
    }, [fileContents]);

    // 레이아웃 알고리즘
    const { nodes, edges, stats, flatFiles } = useMemo(() => {
        const generatedNodes = [];
        const generatedEdges = [];
        
        const extractFiles = (nodesArr) => {
            let result = [];
            nodesArr.forEach(n => {
                const type = String(n.type || '').toLowerCase();
                if (type === 'file') result.push(n);
                else if (n.children) result = result.concat(extractFiles(n.children));
            });
            return result;
        };

        const allFiles = tree ? extractFiles(Array.isArray(tree) ? tree : [tree]) : [];

        const getRole = (node) => {
            const content = fileContents[node.id];
            if (content) {
                if (/@(Rest)?Controller/i.test(content)) return 'controller';
                if (/@Service/i.test(content)) return 'service';
                if (/@(Repository|Mapper|Dao)/i.test(content)) return 'db';
                if (/@(Entity|Table|Document)/i.test(content)) return 'entity';
            }
            const lower = node.name.toLowerCase();
            if (lower.includes('controller')) return 'controller';
            if (lower.includes('service')) return 'service';
            if (lower.includes('repository') || lower.includes('mapper')) return 'db';
            if (lower.includes('entity') || lower.includes('dto')) return 'entity';
            return 'file'; 
        };

        const grouped = { controller: [], service: [], db: [], entity: [], file: [] };

        allFiles.forEach(file => {
            const role = getRole(file);
            if (grouped[role]) grouped[role].push(file);
        });

        const calcStats = {
            controller: grouped.controller.length, service: grouped.service.length,
            db: grouped.db.length, entity: grouped.entity.length, total: allFiles.length
        };

        let currentY = 50;
        const layerGapY = 160; 
        const nodeWidth = 260;
        const nodeGapX = 40; 

        const layoutArchitectureLayer = (filesInLayer, layerName, role) => {
            if (filesInLayer.length === 0) return []; 
            const totalWidth = filesInLayer.length * nodeWidth + (filesInLayer.length - 1) * nodeGapX;
            let startX = -(totalWidth / 2) + (nodeWidth / 2);
            const layerNodeIds = [];

            filesInLayer.forEach((file, idx) => {
                const fileApis = apiEndpoints.filter(api => api.fullPath === file.id).length;
                generatedNodes.push({
                    id: file.id, type: 'custom', position: { x: startX + idx * (nodeWidth + nodeGapX), y: currentY },
                    data: { label: file.name, role: role, layerName: `${layerName} LAYER`, showLayerLabel: idx === 0, fullPath: file.id, status: 'normal', apiCount: fileApis }
                });
                layerNodeIds.push(file.id);
            });
            currentY += layerGapY; 
            return layerNodeIds;
        };

        const layoutGeneralGrid = (filesInLayer) => {
            if (filesInLayer.length === 0) return;
            currentY += 20; 
            const cols = 4; 
            const smallNodeWidth = 180;
            const smallNodeGapX = 20;
            const smallNodeGapY = 80;

            const rows = Math.ceil(filesInLayer.length / cols);
            filesInLayer.forEach((file, idx) => {
                const row = Math.floor(idx / cols);
                const col = idx % cols;
                const itemsInThisRow = row === rows - 1 ? (filesInLayer.length % cols || cols) : cols;
                const totalWidth = itemsInThisRow * smallNodeWidth + (itemsInThisRow - 1) * smallNodeGapX;
                const startX = -(totalWidth / 2) + (smallNodeWidth / 2);

                generatedNodes.push({
                    id: file.id, type: 'custom', position: { x: startX + col * (smallNodeWidth + smallNodeGapX), y: currentY + (row * smallNodeGapY) },
                    data: { label: file.name, role: 'file', layerName: `GENERAL FILES`, showLayerLabel: idx === 0, fullPath: file.id, status: 'normal' }
                });
            });
        };

        const cIds = layoutArchitectureLayer(grouped.controller, 'CONTROLLER', 'controller');
        const sIds = layoutArchitectureLayer(grouped.service, 'SERVICE', 'service');
        const dbIds = layoutArchitectureLayer(grouped.db, 'DATA', 'db');
        const eIds = layoutArchitectureLayer(grouped.entity, 'DOMAIN', 'entity');
        
        const activeLayers = [cIds, sIds, dbIds].filter(layer => layer.length > 0);
        for (let i = 0; i < activeLayers.length - 1; i++) {
            const sourceIds = activeLayers[i];
            const targetIds = activeLayers[i + 1];
            sourceIds.forEach((sId, idx) => {
                const tId = targetIds[idx % targetIds.length];
                generatedEdges.push({
                    id: `e-${sId}-${tId}`, source: sId, target: tId, type: 'step', 
                    style: { stroke: '#cbd5e1', strokeWidth: 2 },
                });
            });
        }
        layoutGeneralGrid(grouped.file);

        return { nodes: generatedNodes, edges: generatedEdges, stats: calcStats, flatFiles: allFiles };
    }, [tree, fileContents, apiEndpoints]);

    const handleNodeClick = useCallback((event, node) => {
        setSelectedNode(node.data);
        setSelectedApi(null); 
        setResData(null);
    }, []);

    const openFileInEditor = () => {
        if (selectedNode && selectedNode.fullPath) {
            dispatch(setActiveFile(selectedNode.fullPath));
            dispatch(setActiveActivity('editor'));
            if (!isSplit) dispatch(closeCodeMap());
        }
    };

    const handleTestApi = async () => {
        if (!selectedApi) return;
        setIsTesting(true);
        setResData(null);
        setResStatus(null);
        
        try {
            const options = {
                method: selectedApi.method,
                headers: { 'Content-Type': 'application/json' },
            };
            if (['POST', 'PUT', 'PATCH'].includes(selectedApi.method) && reqBody) {
                options.body = reqBody;
            }
            
            const response = await fetch(`http://localhost:8080${selectedApi.path}`, options);
            const textData = await response.text(); 
            
            try { setResData(JSON.parse(textData)); } 
            catch { setResData(textData); }
            
            setResStatus(response.status);
        } catch (err) {
            setResData("네트워크 오류: 서버가 실행 중인지 확인하세요.\n" + err.message);
            setResStatus(500);
        } finally {
            setIsTesting(false);
        }
    };

    const getMethodStyle = (method) => {
        switch(method) {
            case 'GET': return 'border-green-300 text-green-600 bg-white hover:bg-green-50';
            case 'POST': return 'border-blue-300 text-blue-600 bg-white hover:bg-blue-50';
            case 'PUT': return 'border-yellow-400 text-yellow-600 bg-white hover:bg-yellow-50';
            case 'DELETE': return 'border-red-300 text-red-600 bg-white hover:bg-red-50';
            default: return 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50';
        }
    };

    // 💡 [수정] 반응형을 위한 동적 클래스 세팅
    const panelSizeClass = isSplit 
        ? "absolute right-4 top-4 w-[280px] max-h-[calc(100%-2rem)]" // 분할화면: 작게, 여백 줄임
        : "absolute right-10 top-10 w-[360px] max-h-[calc(100%-5rem)]"; // 전체화면: 크고 넓게

    const paddingClass = isSplit ? "p-5" : "p-7";
    const titleSizeClass = isSplit ? "text-base" : "text-lg";

    return (
        <div className="w-full h-full flex bg-[#fafafa] animate-fade-in relative overflow-hidden font-sans">
            {/* 왼쪽 사이드바: 전체화면일 때만 렌더링 */}
            {!isSplit && (
                <div className="w-64 bg-[#fafafa] border-r border-gray-200 flex flex-col shrink-0 z-10">
                    <div className="p-6 pb-2">
                        <h3 className="text-[11px] font-extrabold text-gray-400 tracking-widest mb-4">PROJECT STRUCTURE</h3>
                        <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar">
                            {flatFiles.map(f => {
                                const content = fileContents[f.id] || '';
                                let isC = /@(Rest)?Controller/i.test(content) || f.name.includes('Controller');
                                let isS = /@Service/i.test(content) || f.name.includes('Service');
                                let isR = /@(Repository|Mapper)/i.test(content) || f.name.includes('Repository');
                                let isE = /@Entity/i.test(content) || f.name.includes('Entity');

                                return (
                                    <div key={f.id} className="flex items-center gap-2 text-[13px] text-gray-700 hover:text-blue-600 cursor-pointer transition-colors truncate">
                                        {isC ? <VscFile className="text-blue-500" /> :
                                         isS ? <VscFile className="text-green-500" /> :
                                         isR ? <VscFile className="text-purple-500" /> :
                                         isE ? <VscFile className="text-orange-500" /> :
                                         <VscFile className="text-gray-400" />}
                                        <span className="truncate">{f.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
                    <div className="p-6 border-t border-gray-200 mt-4">
                        <h3 className="text-[11px] font-extrabold text-gray-400 tracking-widest mb-4">아키텍처 통계</h3>
                        <div className="space-y-3 text-[13px] text-gray-600 font-medium">
                            <div className="flex justify-between items-center"><span>컨트롤러</span> <span className="font-bold text-gray-900">{stats.controller}개</span></div>
                            <div className="flex justify-between items-center"><span>서비스</span> <span className="font-bold text-gray-900">{stats.service}개</span></div>
                            <div className="flex justify-between items-center"><span>레포지토리</span> <span className="font-bold text-gray-900">{stats.db}개</span></div>
                            <div className="flex justify-between items-center"><span>엔티티</span> <span className="font-bold text-gray-900">{stats.entity}개</span></div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col relative w-full h-full">
                {/* 헤더 */}
                <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-50">
                    <div className="flex items-center gap-3">
                        <h2 className="text-[15px] font-extrabold text-gray-900">코드 맵</h2>
                        {!isSplit && <p className="text-[12px] text-gray-500 mt-0.5">프로젝트의 구조와 컴포넌트 관계를 시각화합니다</p>}
                    </div>
                    <button 
                        onClick={() => dispatch(closeCodeMap())}
                        className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors text-xs font-bold shadow-sm"
                    >
                        닫기
                    </button>
                </div>

                {/* 맵 컨테이너 */}
                <div className="flex-1 relative w-full h-full">
                    <ReactFlow 
                        nodes={nodes} edges={edges} nodeTypes={nodeTypes}
                        onNodeClick={handleNodeClick} 
                        onPaneClick={() => {setSelectedNode(null); setSelectedApi(null);}} 
                        fitView fitViewOptions={{ padding: isSplit ? 0.2 : 0.15 }} // 분할화면 시 여백을 살짝 늘려 안정감 부여
                        attributionPosition="bottom-right" minZoom={0.1}
                    >
                        <Background color="transparent" /> 
                        <Controls className="shadow-md border border-gray-200 rounded-lg bg-white"/>
                    </ReactFlow>

                    {/* ========================================================= */}
                    {/* 💡 [수정] 반응형 & 스크롤 완벽 적용된 우측 상세/테스터 패널 */}
                    {/* ========================================================= */}
                    {selectedNode && (
                        <div className={`${panelSizeClass} bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)] rounded-2xl z-[100] flex flex-col overflow-hidden animate-fade-in border border-gray-100`}>
                            
                            {/* 패널 내부 스크롤 (이 부분이 길어지면 안에서만 스크롤됨) */}
                            <div className={`${paddingClass} overflow-y-auto custom-scrollbar flex-1`}>
                                <div className="flex justify-between items-start mb-5">
                                    <h3 className={`font-extrabold text-gray-900 ${titleSizeClass}`}>상세 정보</h3>
                                </div>
                                
                                <div className="space-y-5">
                                    <div className="flex justify-between border-b border-gray-100 pb-3">
                                        <div>
                                            <div className="text-[10px] text-gray-500 mb-1">타입</div>
                                            <div className={`font-bold text-gray-800 ${isSplit ? 'text-[11px]' : 'text-[13px]'}`}>
                                                {selectedNode.role === 'controller' ? 'REST Controller' : 
                                                 selectedNode.role === 'service' ? 'Business Service' : 
                                                 selectedNode.role === 'db' ? 'Repository' : 
                                                 selectedNode.role === 'entity' ? 'Domain Entity' : 'General File'}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-gray-500 mb-1">파일명</div>
                                            <div className={`font-bold text-gray-800 truncate ${isSplit ? 'max-w-[100px] text-[11px]' : 'max-w-[120px] text-[13px]'}`} title={selectedNode.label}>
                                                {selectedNode.label}
                                            </div>
                                        </div>
                                    </div>

                                    {/* API 뱃지 리스트 */}
                                    {selectedNode.role === 'controller' && (
                                        <div>
                                            <div className="text-[11px] font-medium text-gray-500 mb-2 flex items-center gap-1">
                                                엔드포인트 <span className="text-blue-500 text-[9px] font-bold">(클릭하여 테스트)</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {apiEndpoints.filter(api => api.fullPath === selectedNode.fullPath).length > 0 ? (
                                                    apiEndpoints.filter(api => api.fullPath === selectedNode.fullPath).map((api, idx) => (
                                                        <div 
                                                            key={idx} 
                                                            onClick={() => { setSelectedApi(api); setResData(null); }}
                                                            className={`px-2.5 py-1 text-[10px] font-bold border rounded-full font-mono cursor-pointer transition-transform hover:scale-105 active:scale-95 ${getMethodStyle(api.method)} ${selectedApi?.path === api.path ? 'ring-2 ring-offset-2 ring-blue-400' : 'shadow-sm'}`}
                                                        >
                                                            {api.method} {api.path}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-[11px] text-gray-400">발견된 엔드포인트가 없습니다.</div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quick API Tester UI */}
                                    {selectedApi && (
                                        <div className="mt-3 pt-4 border-t border-gray-100 animate-fade-in">
                                            <div className="flex items-center gap-1.5 mb-2.5">
                                                <VscBeaker className="text-blue-600" size={14} />
                                                <span className="text-[12px] font-bold text-gray-900">Quick Tester</span>
                                            </div>

                                            <div className="bg-[#f8f9fa] border border-gray-200 rounded-lg p-2.5 space-y-2.5">
                                                <div className="flex items-center gap-2 bg-white border border-gray-200 px-2 py-1.5 rounded">
                                                    <span className={`text-[9px] font-black ${getMethodStyle(selectedApi.method).split(' ')[1]}`}>{selectedApi.method}</span>
                                                    <span className="text-[10px] font-mono text-gray-700 truncate">http://localhost:8080{selectedApi.path}</span>
                                                </div>

                                                {['POST', 'PUT', 'PATCH'].includes(selectedApi.method) && (
                                                    <div>
                                                        <div className="text-[9px] text-gray-500 font-bold mb-1">Request Body (JSON)</div>
                                                        <textarea 
                                                            className="w-full text-[10px] font-mono p-2 border border-gray-200 rounded bg-white outline-none focus:border-blue-400 h-14 resize-none shadow-inner"
                                                            placeholder='{"key": "value"}'
                                                            value={reqBody}
                                                            onChange={e => setReqBody(e.target.value)}
                                                        />
                                                    </div>
                                                )}

                                                <button 
                                                    onClick={handleTestApi}
                                                    disabled={isTesting}
                                                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded flex items-center justify-center gap-1.5 transition-colors disabled:bg-blue-300 shadow-sm"
                                                >
                                                    {isTesting ? <VscRefresh className="animate-spin" size={12}/> : <VscPlay size={12}/>}
                                                    {isTesting ? 'Sending Request...' : 'Send Request'}
                                                </button>

                                                {/* 서버 응답 결과 패널 */}
                                                {resStatus && (
                                                    <div className="mt-2 pt-2 border-t border-gray-200 animate-fade-in">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[10px] text-gray-500 font-bold">Response</span>
                                                            <span className={`text-[10px] font-bold flex items-center gap-1 ${resStatus >= 200 && resStatus < 300 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {resStatus >= 200 && resStatus < 300 ? <VscPass/> : <VscError/>} 
                                                                Status: {resStatus}
                                                            </span>
                                                        </div>
                                                        <div className="bg-[#1e1e1e] text-green-400 text-[10px] font-mono p-2.5 rounded-md h-28 overflow-y-auto whitespace-pre-wrap break-all custom-scrollbar shadow-inner">
                                                            {typeof resData === 'object' ? JSON.stringify(resData, null, 2) : resData}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* 하단 고정 버튼 구역 */}
                            <div className="p-3 bg-gray-50 border-t border-gray-100 shrink-0">
                                <button 
                                    onClick={openFileInEditor}
                                    className="w-full py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-[12px] font-bold transition-colors flex items-center justify-center gap-1.5 shadow-md"
                                >
                                    에디터에서 파일 열기 <VscGoToFile size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}