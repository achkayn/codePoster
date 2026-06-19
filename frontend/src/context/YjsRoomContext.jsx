import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

const FILE_KEYS = ['neural_hash', 'data_sort', 'auth_check', 'key_rotation', 'grid_scan'];

const YjsRoomContext = createContext(null);

export function YjsRoomProvider({ roomId, username, initialCode = {}, fileKeys = FILE_KEYS, children }) {
    const [ready, setReady] = useState(false);
    const [ydoc, setYdoc] = useState(null);
    const [awareness, setAwareness] = useState(null);
    const providerRef = useRef(null);
    const seededRef = useRef(false);

    useEffect(() => {
        if (!roomId) return;

        const keys = fileKeys.length ? fileKeys : FILE_KEYS;
        const doc = new Y.Doc();
        const provider = new WebrtcProvider(`cp-room-${roomId}`, doc, {
            signaling: ['wss://signaling.yjs.dev'],
        });

        providerRef.current = provider;
        setYdoc(doc);
        setAwareness(provider.awareness);
        seededRef.current = false;
        // Doc is usable immediately; y-webrtc only emits "synced" after a peer connects.
        setReady(true);

        const seedAll = () => {
            if (seededRef.current) return;
            let anyEmpty = false;
            keys.forEach((key) => {
                if (doc.getText(key).length === 0) anyEmpty = true;
            });
            if (!anyEmpty) {
                seededRef.current = true;
                return;
            }
            seededRef.current = true;
            doc.transact(() => {
                keys.forEach((key) => {
                    const ytext = doc.getText(key);
                    if (ytext.length === 0 && initialCode[key]) {
                        ytext.insert(0, initialCode[key]);
                    }
                });
            });
        };

        const timer = setTimeout(seedAll, 600);
        const onSynced = () => {
            const hasContent = keys.some((key) => doc.getText(key).length > 0);
            if (hasContent) seededRef.current = true;
            else seedAll();
        };

        provider.on('synced', onSynced);

        return () => {
            clearTimeout(timer);
            provider.off('synced', onSynced);
            provider.destroy();
            doc.destroy();
            providerRef.current = null;
            setYdoc(null);
            setAwareness(null);
            setReady(false);
        };
    }, [roomId, fileKeys, initialCode]); // eslint-disable-line react-hooks/exhaustive-deps

    const getYText = useCallback((fileKey) => {
        if (!ydoc) return null;
        return ydoc.getText(fileKey);
    }, [ydoc, fileKeys]);

    const resetAllFiles = useCallback((codeMap) => {
        if (!ydoc) return;
        ydoc.transact(() => {
            (fileKeys.length ? fileKeys : FILE_KEYS).forEach((key) => {
                const ytext = ydoc.getText(key);
                const code = codeMap[key] ?? '';
                if (ytext.length > 0) ytext.delete(0, ytext.length);
                if (code) ytext.insert(0, code);
            });
        });
    }, [ydoc]);

    const value = useMemo(
        () => ({
            ready,
            ydoc,
            provider: providerRef.current,
            awareness,
            getYText,
            resetAllFiles,
            fileKeys: fileKeys.length ? fileKeys : FILE_KEYS,
        }),
        [ready, ydoc, awareness, getYText, resetAllFiles, fileKeys]
    );

    return (
        <YjsRoomContext.Provider value={value}>
            {children}
        </YjsRoomContext.Provider>
    );
}

export function useYjsRoom() {
    const ctx = useContext(YjsRoomContext);
    if (!ctx) throw new Error('useYjsRoom must be used within YjsRoomProvider');
    return ctx;
}

export { FILE_KEYS };
