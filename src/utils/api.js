// src/utils/api.js

const API_BASE = "http://localhost:8080/api/workspaces";
const GIT_API_BASE = "http://localhost:8080/api/git"; 

// ============================================================================
// 📁 워크스페이스 및 프로젝트 API
// ============================================================================

export const getMyWorkspacesApi = async (userId = "user1") => {
  const response = await fetch(`${API_BASE}?userId=${userId}`);
  if (!response.ok) throw new Error("워크스페이스 목록 로드 실패");
  return await response.json();
};

export const createWorkspaceApi = async (name, path = "", userId = "user1") => {
  const response = await fetch(`${API_BASE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, name, path }),
  });
  if (!response.ok) throw new Error("워크스페이스 생성 실패");
  return await response.json();
};

export const fetchWorkspaceProjectsApi = async (workspaceId) => {
    const response = await fetch(`${API_BASE}/${workspaceId}/projects`);
    if (!response.ok) throw new Error("프로젝트 목록 로드 실패");
    return await response.json();
};

export const createProjectInWorkspaceApi = async (workspaceId, projectName, language, description = "", gitUrl = "") => {
  const response = await fetch(`${API_BASE}/project`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId, projectName, language, description, gitUrl }),
  });
  if (!response.ok) throw new Error("프로젝트 생성 실패");
};

// ============================================================================
// 📁 파일 시스템 조작 API
// ============================================================================

export const fetchProjectFilesApi = async (workspaceId, projectName, branchName = "master") => {
  const url = `${API_BASE}/${workspaceId}/files?projectName=${projectName}&branchName=${branchName}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("파일 트리 로드 실패");
  return await response.json();
};

export const fetchFileContentApi = async (workspaceId, projectName, branchName, filePath) => {
    const url = `${API_BASE}/${workspaceId}/file?projectName=${projectName}&branchName=${branchName}&path=${encodeURIComponent(filePath)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("파일 내용 로드 실패");
    return await response.text();
};

export const createFileApi = async (workspaceId, projectName, branchName, filePath, type) => {
  const response = await fetch(`${API_BASE}/files`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId, projectName, branchName, filePath, type, code: "" }), 
  });
  if (!response.ok) throw new Error("파일 생성 실패");
};

export const saveFileApi = async (workspaceId, projectName, branchName, filePath, code) => {
  const response = await fetch(`${API_BASE}/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId, projectName, branchName, filePath, code }),
  });
  if (!response.ok) throw new Error("파일 저장 실패");
};

export const deleteFileApi = async (workspaceId, projectName, branchName, filePath) => {
  const response = await fetch(`${API_BASE}/files`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId, projectName, branchName, filePath })
  });
  if (!response.ok) throw new Error("삭제 실패");
};

export const renameFileApi = async (workspaceId, projectName, branchName, filePath, newName) => {
  const response = await fetch(`${API_BASE}/files/rename`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId, projectName, branchName, filePath, newName }),
  });
  if (!response.ok) throw new Error("이름 변경 실패");
};

export const buildProjectApi = async (workspaceId, projectName, branchName, language) => {
  const response = await fetch(`${API_BASE}/build`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId, projectName, branchName, language }),
  });
  if (!response.ok) {
      const errMsg = await response.text();
      throw new Error("빌드 실패: " + errMsg);
  }
  return await response.blob();
};

// ============================================================================
// 🐙 GIT 관련 API
// ============================================================================

export const fetchBranchListApi = async (workspaceId, projectName) => {
  const response = await fetch(`${GIT_API_BASE}/${workspaceId}/${projectName}/branches`);
  if (!response.ok) throw new Error("브랜치 목록 로드 실패");
  return await response.json(); 
};

export const updateGitUrlApi = async (workspaceId, projectName, gitUrl) => {
  const response = await fetch(`${GIT_API_BASE}/project/git-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId, projectName, gitUrl }),
  });
  if (!response.ok) throw new Error("Git 연동 실패");
};

export const createBranchApi = async (workspaceId, projectName, branchName) => {
  const response = await fetch(`${GIT_API_BASE}/branches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId, projectName, branchName }),
  });
  if (!response.ok) {
      const msg = await response.text();
      throw new Error("브랜치 생성 실패: " + msg);
  }
};

export const fetchGitStatusApi = async (workspaceId, projectName, branchName = "master") => {
  const response = await fetch(`${GIT_API_BASE}/${workspaceId}/${projectName}/status?branchName=${branchName}`);
  if (!response.ok) throw new Error("Git 상태 조회 실패");
  return await response.json(); 
};

export const stageFilesApi = async (workspaceId, projectName, branchName, filePattern) => {
  const response = await fetch(`${GIT_API_BASE}/stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, projectName, branchName, filePattern })
  });
  if (!response.ok) throw new Error("스테이징 실패");
};

export const unstageFilesApi = async (workspaceId, projectName, branchName, filePattern) => {
  const response = await fetch(`${GIT_API_BASE}/unstage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, projectName, branchName, filePattern })
  });
  if (!response.ok) throw new Error("언스테이징 실패");
};

export const commitChangesApi = async (workspaceId, projectName, branchName, commitMessage, authorName, authorEmail) => {
  const response = await fetch(`${GIT_API_BASE}/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, projectName, branchName, commitMessage, authorName, authorEmail })
  });
  if (!response.ok) throw new Error("커밋 실패");
};

export const pushToRemoteApi = async (workspaceId, projectName, branchName, token) => {
    const response = await fetch(`${GIT_API_BASE}/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, projectName, branchName, token })
    });
    if (!response.ok) {
        const errMsg = await response.text();
        throw new Error(errMsg || "푸시 실패");
    }
};

export const fetchSystemRootsApi = async () => {
    const response = await fetch(`http://localhost:8080/api/system/roots`);
    if (!response.ok) throw new Error("드라이브 목록 로드 실패");
    return await response.json();
};

export const fetchSubFoldersApi = async (path) => {
    const response = await fetch(`http://localhost:8080/api/system/folders?path=${encodeURIComponent(path)}`);
    if (!response.ok) throw new Error("폴더 목록 로드 실패");
    return await response.json();
};

export const fetchGitHistoryApi = async (workspaceId, projectName, branchName = 'master') => {
    try {
        const url = `${GIT_API_BASE}/${workspaceId}/${encodeURIComponent(projectName)}/history?branchName=${encodeURIComponent(branchName)}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error(`히스토리 로드 실패: ${response.status}`);
        
        const data = await response.json();
        return data.map(log => ({
            graph: log.graph || '', 
            hash: log.hash || log.commitHash || log.id || '', 
            message: log.message || log.commitMessage || log.msg || '', 
            author: log.author || log.authorName || log.committer || '', 
            date: log.date || log.commitDate || log.time || '',
            refs: log.refs || log.branches || ''
        }));
    } catch (error) {
        console.error("Git History API Error:", error);
        return []; 
    }
};

export const pullFromRemoteApi = async (workspaceId, projectName, branchName, token) => {
    const response = await fetch(`${GIT_API_BASE}/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, projectName, branchName, token })
    });
    if (!response.ok) throw new Error(await response.text() || "Pull 실패");
    return await response.text();
};

export const resetCommitApi = async (workspaceId, projectName, branchName, targetHash) => {
    const response = await fetch(`${GIT_API_BASE}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, projectName, branchName, targetHash })
    });
    if (!response.ok) throw new Error("Reset 실패");
};

export const checkoutCommitApi = async (workspaceId, projectName, branchName, targetHash) => {
    const response = await fetch(`${GIT_API_BASE}/checkout-commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, projectName, branchName, targetHash })
    });
    if (!response.ok) throw new Error("체크아웃 실패 (작업 중인 파일을 먼저 커밋하거나 Stash 해야 합니다.)");
};

export const mergeCommitApi = async (workspaceId, projectName, branchName, targetHash) => {
    const response = await fetch(`${GIT_API_BASE}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, projectName, branchName, targetBranch: targetHash }) 
    });
    if (!response.ok) throw new Error("Merge 실패 (충돌 발생)");
};

// 💡 [New] 병합 취소 (Abort Merge) API 추가
export const abortMergeApi = async (workspaceId, projectName, branchName) => {
    const response = await fetch(`${GIT_API_BASE}/merge/abort`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, projectName, branchName }) 
    });
    if (!response.ok) throw new Error("병합 취소 실패");
};

export const createCodeMapComponentApi = async (workspaceId, projectName, branchName, name, type) => {
    const response = await fetch(`http://localhost:8080/api/codemap/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, projectName, branchName, name, type })
    });
    if (!response.ok) throw new Error("컴포넌트 생성 실패");
    return await response.text();
};

// src/utils/api.js 파일 맨 아래에 추가

export const createCodeMapRelationApi = async (workspaceId, projectName, branchName, sourceNode, targetNode, relationType) => {
    const response = await fetch(`http://localhost:8080/api/codemap/relations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, projectName, branchName, sourceNode, targetNode, relationType })
    });
    if (!response.ok) throw new Error("관계(의존성) 주입 실패");
    return await response.text();
};

// src/utils/api.js 맨 아래

export const deleteCodeMapRelationApi = async (workspaceId, projectName, branchName, sourceNode, targetNode, relationType) => {
    const response = await fetch(`http://localhost:8080/api/codemap/relations`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, projectName, branchName, sourceNode, targetNode, relationType })
    });
    
    // 💡 [해결 2] 백엔드가 던진 상세 에러 메시지를 가로채서 에러를 발생시킵니다.
    if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(errorMsg || "관계 삭제 실패");
    }
    return await response.text();
};

// src/utils/api.js 맨 아래 추가
export const fetchAiAssistApi = async (payload) => {
    const response = await fetch(`http://localhost:8080/api/ai/assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("AI 어시스트 요청 실패");
    return await response.json();
};

// 파일 맨 아래에 추가해 주세요!

export const fetchAiAutocompleteApi = async (payload) => {
    const response = await fetch(`http://localhost:8080/api/ai/autocomplete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Autocomplete failed");
    return await response.text(); // 여기선 JSON이 아니라 그냥 쌩 텍스트(코드)를 받습니다.
};