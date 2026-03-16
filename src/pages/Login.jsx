import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { loginApi, registerApi } from '../utils/api';

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [isLoginMode, setIsLoginMode] = useState(true);
    
    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLoginMode) {
                // 💡 로그인 API 호출
                const res = await loginApi(email, password);
                login(res.accessToken, res.userId); // AuthContext에 토큰 저장
                navigate('/'); // 대시보드로 이동
            } else {
                // 💡 회원가입 API 호출
                await registerApi(email, nickname, password);
                alert('회원가입 성공! 로그인해주세요.');
                setIsLoginMode(true); // 로그인 화면으로 전환
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center p-4">
            <div className="bg-[#252526] w-full max-w-md rounded-2xl p-8 shadow-2xl border border-[#333]">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        <span className="text-blue-500">WebIDE</span>
                    </h1>
                    <p className="text-gray-400">{isLoginMode ? '로그인하여 개발을 시작하세요' : '새로운 계정을 생성하세요'}</p>
                </div>

                <div className="flex mb-6 bg-[#1e1e1e] rounded-lg p-1">
                    <button 
                        className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${isLoginMode ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => { setIsLoginMode(true); setError(''); }}
                    >
                        로그인
                    </button>
                    <button 
                        className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${!isLoginMode ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => { setIsLoginMode(false); setError(''); }}
                    >
                        회원가입
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">이메일</label>
                        <input 
                            type="email" required
                            value={email} onChange={e => setEmail(e.target.value)}
                            className="w-full bg-[#1e1e1e] border border-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="name@example.com"
                        />
                    </div>
                    
                    {!isLoginMode && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">닉네임</label>
                            <input 
                                type="text" required
                                value={nickname} onChange={e => setNickname(e.target.value)}
                                className="w-full bg-[#1e1e1e] border border-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500"
                                placeholder="멋진 닉네임"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">비밀번호</label>
                        <input 
                            type="password" required
                            value={password} onChange={e => setPassword(e.target.value)}
                            className="w-full bg-[#1e1e1e] border border-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <button 
                        type="submit" disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg mt-6 transition-colors disabled:bg-blue-800"
                    >
                        {loading ? '처리 중...' : (isLoginMode ? '로그인' : '회원가입')}
                    </button>
                </form>
            </div>
        </div>
    );
}