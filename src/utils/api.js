// src/utils/api.js

const API_BASE = "http://localhost:8080/api/workspaces";
const GIT_API_BASE = "http://localhost:8080/api/git"; 
const AUTH_API_BASE = "http://localhost:8080/api/users"; 

const getCurrentUserId = () => localStorage.getItem("userId");

const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  
  return fetch(url, { ...options, headers });
};

// ============================================================================
// 🔐 인증 및 유저 API
// ============================================================================

export const loginApi = async (email, password) => {
    const response = await fetch(`${AUTH_API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error("로그인 실패: 이메일이나 비밀번호를 확인해주세요.");
    return await response.json(); 
};

export const registerApi = async (email, nickname, password) => {
    const response = await fetch(`${AUTH_API_BASE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nickname, password }),
    });
    if (!response.ok) throw new Error("회원가입 실패: 이미 존재하는 이메일/닉네임입니다.");
    return await response.json();
};

// 💡 [신규 추가] 유저 프로필 정보 가져오기
export const getUserProfileApi = async (userId) => {
    const response = await authFetch(`${AUTH_API_BASE}/${userId}`);
    if (!response.ok) throw new Error("유저 정보를 불러올 수 없습니다.");
    return await response.json();
};

// ============================================================================
// 📁 워크스페이스 및 프로젝트 API
// ============================================================================

export const getMyWorkspacesApi = async (userId = getCurrentUserId()) => {
  const response = await authFetch(`${API_BASE}?userId=${userId}`);
  if (!response.ok) throw new Error("워크스페이스 목록 로드 실패");
  return await response.json();
};

export const createWorkspaceApi = async (name, path = "", userId = getCurrentUserId()) => {
  const response = await authFetch(`${API_BASE}`, {
    method: "POST",
    body: JSON.stringify({ userId: userId.toString(), name, path, type: "PERSONAL" }), 
  });
  if (!response.ok) throw new Error("워크스페이스 생성 실패");
  return await response.json();
};

export const fetchWorkspaceProjectsApi = async (workspaceId) => {
    const response = await authFetch(`${API_BASE}/${workspaceId}/projects`);
    if (!response.ok) throw new Error("프로젝트 목록 로드 실패");
    return await response.json();
};

export const createProjectInWorkspaceApi = async (workspaceId, projectName, language, description = "", gitUrl = "") => {
  const response = await authFetch(`${API_BASE}/project`, {
    method: "POST",
    body: JSON.stringify({ workspaceId, projectName, language, description, gitUrl }),
  });
  if (!response.ok) throw new Error("프로젝트 생성 실패");
};

// ============================================================================
// 📁 파일 시스템 조작 API
// ============================================================================

export const fetchProjectFilesApi = async (workspaceId, projectName, branchName = "master") => {
  const response = await authFetch(`${API_BASE}/${workspaceId}/files?projectName=${projectName}&branchName=${branchName}`);
  if (!response.ok) throw new Error("파일 트리 로드 실패");
  return await response.json();
};

export const fetchFileContentApi = async (workspaceId, projectName, branchName, filePath) => {
    const response = await authFetch(`${API_BASE}/${workspaceId}/file?projectName=${projectName}&branchName=${branchName}&path=${encodeURIComponent(filePath)}`);
    if (!response.ok) throw new Error("파일 내용 로드 실패");
    return await response.text();
};

export const createFileApi = async (workspaceId, projectName, branchName, filePath, type) => {
  const response = await authFetch(`${API_BASE}/files`, {
    method: "POST",
    body: JSON.stringify({ workspaceId, projectName, branchName, filePath, type, code: "" }), 
  });
  if (!response.ok) throw new Error("파일 생성 실패");
};

export const saveFileApi = async (workspaceId, projectName, branchName, filePath, code) => {
  const response = await authFetch(`${API_BASE}/save`, {
    method: "POST",
    body: JSON.stringify({ workspaceId, projectName, branchName, filePath, code }),
  });
  if (!response.ok) throw new Error("파일 저장 실패");
};

export const deleteFileApi = async (workspaceId, projectName, branchName, filePath) => {
  const response = await authFetch(`${API_BASE}/files`, {
    method: "DELETE",
    body: JSON.stringify({ workspaceId, projectName, branchName, filePath })
  });
  if (!response.ok) throw new Error("삭제 실패");
};

export const renameFileApi = async (workspaceId, projectName, branchName, filePath, newName) => {
  const response = await authFetch(`${API_BASE}/files/rename`, {
    method: "PUT",
    body: JSON.stringify({ workspaceId, projectName, branchName, filePath, newName }),
  });
  if (!response.ok) throw new Error("이름 변경 실패");
};

export const buildProjectApi = async (workspaceId, projectName, branchName, language) => {
  const response = await authFetch(`${API_BASE}/build`, {
    method: "POST",
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
  const response = await authFetch(`${GIT_API_BASE}/${workspaceId}/${projectName}/branches`);
  if (!response.ok) throw new Error("브랜치 목록 로드 실패");
  return await response.json(); 
};

export const updateGitUrlApi = async (workspaceId, projectName, gitUrl) => {
  const response = await authFetch(`${GIT_API_BASE}/project/git-url`, {
    method: "POST",
    body: JSON.stringify({ workspaceId, projectName, gitUrl }),
  });
  if (!response.ok) throw new Error("Git 연동 실패");
};

export const createBranchApi = async (workspaceId, projectName, branchName) => {
  const response = await authFetch(`${GIT_API_BASE}/branches`, {
    method: "POST",
    body: JSON.stringify({ workspaceId, projectName, branchName }),
  });
  if (!response.ok) {
      const msg = await response.text();
      throw new Error("브랜치 생성 실패: " + msg);
  }
};

export const fetchGitStatusApi = async (workspaceId, projectName, branchName = "master") => {
  const response = await authFetch(`${GIT_API_BASE}/${workspaceId}/${projectName}/status?branchName=${branchName}`);
  if (!response.ok) throw new Error("Git 상태 조회 실패");
  return await response.json(); 
};

export const stageFilesApi = async (workspaceId, projectName, branchName, filePattern) => {
  const response = await authFetch(`${GIT_API_BASE}/stage`, {
      method: 'POST',
      body: JSON.stringify({ workspaceId, projectName, branchName, filePattern })
  });
  if (!response.ok) throw new Error("스테이징 실패");
};

export const unstageFilesApi = async (workspaceId, projectName, branchName, filePattern) => {
  const response = await authFetch(`${GIT_API_BASE}/unstage`, {
      method: 'POST',
      body: JSON.stringify({ workspaceId, projectName, branchName, filePattern })
  });
  if (!response.ok) throw new Error("언스테이징 실패");
};

export const commitChangesApi = async (workspaceId, projectName, branchName, commitMessage, authorName, authorEmail) => {
  const response = await authFetch(`${GIT_API_BASE}/commit`, {
      method: 'POST',
      body: JSON.stringify({ workspaceId, projectName, branchName, commitMessage, authorName, authorEmail })
  });
  if (!response.ok) throw new Error("커밋 실패");
};

export const pushToRemoteApi = async (workspaceId, projectName, branchName, token) => {
    const response = await authFetch(`${GIT_API_BASE}/push`, {
        method: 'POST',
        body: JSON.stringify({ workspaceId, projectName, branchName, token })
    });
    if (!response.ok) {
        const errMsg = await response.text();
        throw new Error(errMsg || "푸시 실패");
    }
};

export const fetchSystemRootsApi = async () => {
    const response = await authFetch(`http://localhost:8080/api/system/roots`);
    if (!response.ok) throw new Error("드라이브 목록 로드 실패");
    return await response.json();
};

export const fetchSubFoldersApi = async (path) => {
    const response = await authFetch(`http://localhost:8080/api/system/folders?path=${encodeURIComponent(path)}`);
    if (!response.ok) throw new Error("폴더 목록 로드 실패");
    return await response.json();
};

export const fetchGitHistoryApi = async (workspaceId, projectName, branchName = 'master') => {
    try {
        const response = await authFetch(`${GIT_API_BASE}/${workspaceId}/${encodeURIComponent(projectName)}/history?branchName=${encodeURIComponent(branchName)}`);
        if (!response.ok) throw new Error(`히스토리 로드 실패`);
        const data = await response.json();
        return data.map(log => ({
            graph: log.graph || '', 
            hash: log.hash || log.commitHash || log.id || '', 
            message: log.message || log.commitMessage || log.msg || '', 
            author: log.author || log.authorName || log.committer || '', 
            date: log.date || log.commitDate || log.time || '',
            refs: log.refs || log.branches || ''
        }));
    } catch (error) { return []; }
};

export const pullFromRemoteApi = async (workspaceId, projectName, branchName, token) => {
    const response = await authFetch(`${GIT_API_BASE}/pull`, {
        method: 'POST',
        body: JSON.stringify({ workspaceId, projectName, branchName, token })
    });
    if (!response.ok) throw new Error("Pull 실패");
    return await response.text();
};

export const resetCommitApi = async (workspaceId, projectName, branchName, targetHash) => {
    const response = await authFetch(`${GIT_API_BASE}/reset`, {
        method: 'POST',
        body: JSON.stringify({ workspaceId, projectName, branchName, targetHash })
    });
    if (!response.ok) throw new Error("Reset 실패");
};

export const checkoutCommitApi = async (workspaceId, projectName, branchName, targetHash) => {
    const response = await authFetch(`${GIT_API_BASE}/checkout-commit`, {
        method: 'POST',
        body: JSON.stringify({ workspaceId, projectName, branchName, targetHash })
    });
    if (!response.ok) throw new Error("체크아웃 실패");
};

export const mergeCommitApi = async (workspaceId, projectName, branchName, targetHash) => {
    const response = await authFetch(`${GIT_API_BASE}/merge`, {
        method: 'POST',
        body: JSON.stringify({ workspaceId, projectName, branchName, targetBranch: targetHash }) 
    });
    if (!response.ok) throw new Error("Merge 실패");
};

export const abortMergeApi = async (workspaceId, projectName, branchName) => {
    const response = await authFetch(`${GIT_API_BASE}/merge/abort`, {
        method: 'POST',
        body: JSON.stringify({ workspaceId, projectName, branchName }) 
    });
    if (!response.ok) throw new Error("병합 취소 실패");
};

export const createCodeMapComponentApi = async (workspaceId, projectName, branchName, name, type) => {
    const response = await authFetch(`http://localhost:8080/api/codemap/components`, {
        method: 'POST',
        body: JSON.stringify({ workspaceId, projectName, branchName, name, type })
    });
    if (!response.ok) throw new Error("컴포넌트 생성 실패");
    return await response.text();
};

export const createCodeMapRelationApi = async (workspaceId, projectName, branchName, sourceNode, targetNode, relationType) => {
    const response = await authFetch(`http://localhost:8080/api/codemap/relations`, {
        method: 'POST',
        body: JSON.stringify({ workspaceId, projectName, branchName, sourceNode, targetNode, relationType })
    });
    if (!response.ok) throw new Error("관계 주입 실패");
    return await response.text();
};

export const deleteCodeMapRelationApi = async (workspaceId, projectName, branchName, sourceNode, targetNode, relationType) => {
    const response = await authFetch(`http://localhost:8080/api/codemap/relations`, {
        method: 'DELETE',
        body: JSON.stringify({ workspaceId, projectName, branchName, sourceNode, targetNode, relationType })
    });
    if (!response.ok) throw new Error("관계 삭제 실패");
    return await response.text();
};

export const fetchAiAssistApi = async (payload) => {
    const response = await authFetch(`http://localhost:8080/api/ai/assist`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("AI 어시스트 실패");
    return await response.json();
};

export const fetchAiAutocompleteApi = async (payload) => {
    const response = await authFetch(`http://localhost:8080/api/ai/autocomplete`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Autocomplete failed");
    return await response.text();
};