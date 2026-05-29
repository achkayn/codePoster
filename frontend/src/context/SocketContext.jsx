import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import * as Stomp from 'stompjs';

const SocketContext = createContext(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const stompClientRef = useRef(null);
    const subscriptionsRef = useRef({});

    const connect = useCallback((username) => {
        return new Promise((resolve, reject) => {
            if (stompClientRef.current?.connected) {
                resolve(stompClientRef.current);
                return;
            }

            const socket = new SockJS(`http://localhost:8080/ws?username=${encodeURIComponent(username)}`);
            const client = (Stomp.Stomp || Stomp).over(socket);
            
            // Disable debug logging to keep console clean (can be enabled if needed)
            client.debug = () => {};

            client.connect({}, 
                () => {
                    stompClientRef.current = client;
                    setIsConnected(true);
                    console.log('Successfully connected to WebSocket as', username);
                    resolve(client);
                }, 
                (error) => {
                    console.error('STOMP connection error:', error);
                    setIsConnected(false);
                    reject(error);
                }
            );
        });
    }, []);

    const disconnect = useCallback(() => {
        console.log('Attempting to disconnect from WebSocket');
        if (stompClientRef.current?.connected) {
            // Unsubscribe all active subscriptions first
            Object.values(subscriptionsRef.current).forEach(sub => sub.unsubscribe());
            subscriptionsRef.current = {};

            stompClientRef.current.disconnect(() => {
                console.log('Disconnected from WebSocket');
                setIsConnected(false);
                stompClientRef.current = null;
            });
        }
    }, []);

    const subscribe = useCallback((destination, callback) => {
        if (!stompClientRef.current?.connected) {
            console.warn('Cannot subscribe: No active STOMP connection');
            return null;
        }

        const subscription = stompClientRef.current.subscribe(destination, callback);
        subscriptionsRef.current[destination] = subscription;
        return subscription;
    }, []);

    const unsubscribe = useCallback((destination) => {
        if (subscriptionsRef.current[destination]) {
            subscriptionsRef.current[destination].unsubscribe();
            delete subscriptionsRef.current[destination];
        }
    }, []);

    const send = useCallback((destination, headers, body) => {
        if (!stompClientRef.current?.connected) {
            console.warn('Cannot send: No active STOMP connection');
            return;
        }
        stompClientRef.current.send(destination, headers, body);
    }, []);

    const value = {
        isConnected,
        stompClient: stompClientRef.current,
        connect,
        disconnect,
        subscribe,
        unsubscribe,
        send
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
