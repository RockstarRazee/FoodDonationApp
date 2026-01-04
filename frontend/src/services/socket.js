import { io } from 'socket.io-client';

// Connect to backend URL (ensure port matches your backend)
const SOCKET_URL = 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
    transports: ['websocket'],
    withCredentials: true,
    autoConnect: true,
});

export const connectSocket = () => {
    if (!socket.connected) {
        socket.connect();
    }
};

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};
