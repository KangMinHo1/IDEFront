// src/utils/chatSocket.js
import { Client } from '@stomp/stompjs';

let stompClient = null;

export const ChatSocket = {
    // 💡 [수정] userId를 파라미터로 받습니다.
    connect: (workspaceId, userId, onMessageReceived) => {
        if (stompClient && stompClient.connected) return;

        stompClient = new Client({
            brokerURL: 'ws://localhost:8080/ws/chat', 
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('✅ 팀 채팅 소켓 연결 완료!');
                
                // 📢 1. 공용(모두에게) 채팅방 구독
                stompClient.subscribe(`/topic/workspace/${workspaceId}`, (message) => {
                    if (message.body) onMessageReceived(JSON.parse(message.body));
                });

                // 👤 2. 나만의 1:1 개인 채팅방 구독
                stompClient.subscribe(`/topic/workspace/${workspaceId}/user/${userId}`, (message) => {
                    if (message.body) onMessageReceived(JSON.parse(message.body));
                });
            },
            onStompError: (frame) => {
                console.error('❌ Broker reported error: ' + frame.headers['message']);
                console.error('❌ Additional details: ' + frame.body);
            }
        });

        stompClient.activate();
    },

    sendMessage: (messageData) => {
        if (stompClient && stompClient.connected) {
            stompClient.publish({
                destination: '/app/chat.sendMessage',
                body: JSON.stringify(messageData)
            });
        } else {
            console.warn("소켓이 아직 연결되지 않았습니다.");
        }
    },

    disconnect: () => {
        if (stompClient) {
            stompClient.deactivate();
            stompClient = null;
            console.log('팀 채팅 소켓 연결 해제');
        }
    }
};