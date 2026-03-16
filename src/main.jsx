import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Provider } from 'react-redux'
import { store } from './store/store.js'
import { AuthProvider } from './utils/AuthContext.jsx' // 경로 확인

// Monaco Editor 설정 유지
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
loader.config({ monaco });

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </Provider>
)