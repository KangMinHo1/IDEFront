// src/utils/runSocket.js

let socket = null;

export const RunSocket = {
    connectAndRun: (url, payload, onMessage, onError, onClose) => {
        if (socket) {
            socket.onclose = null;
            socket.close();
        }

        const ws = new WebSocket(url);
        socket = ws;

        ws.onopen = () => {
            console.log("[RunSocket] Connected");
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(payload));
            }
        };

        ws.onmessage = (e) => { if (onMessage) onMessage(e.data); };
        ws.onerror = (e) => { if (onError) onError(e); };
        
        ws.onclose = (e) => {
            if (socket === ws) {
                socket = null;
                if (onClose) onClose();
            }
        };
    },

    sendInput: (input) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'INPUT', input: input }));
        }
    },

    //  실행 중단 요청 전송
    stop: () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'STOP' }));
            // 소켓을 바로 닫지 않고, 서버가 컨테이너를 죽인 후 연결을 끊기를 기다리거나
            // UI 반응성을 위해 여기서 강제로 닫을 수도 있음. 
            // 여기서는 서버에 신호만 보냄.
        }
    },

    disconnect: () => {
        if (socket) {
            socket.onclose = null;
            socket.close();
            socket = null;
        }
    }
};