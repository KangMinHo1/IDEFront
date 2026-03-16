import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true); // 새로고침 시 깜빡임 방지용

  useEffect(() => {
    // 앱이 켜질 때 로컬 스토리지에 토큰이 있는지 확인합니다.
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (token && userId) {
      setUser({ id: userId });
      setIsLoggedIn(true);
    }
    setLoading(false);
  }, []);

  // 💡 로그인 (백엔드에서 받은 토큰과 ID를 저장)
  const login = (token, userId) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId);
    setUser({ id: userId });
    setIsLoggedIn(true);
  };

  // 💡 로그아웃 (무상태 JWT이므로 프론트에서 지우기만 하면 끝!)
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setUser(null);
    setIsLoggedIn(false);
  };

  if (loading) return null; // 로딩 중에는 아무것도 안 그려서 라우터 튕김 방지

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);