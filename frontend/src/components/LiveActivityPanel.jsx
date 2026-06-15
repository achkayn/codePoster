import React, { useEffect, useState, useCallback } from 'react';

const FILE_TITLES = {
    neural_hash: 'neural_hash.py',
    data_sort: 'data_sort.py',
    auth_check: 'auth_check.py',
    key_rotation: 'key_rotation.py',
    grid_scan: 'grid_scan.py',
    live: 'Live tab',
};

function fileLabel(key) {
    return FILE_TITLES[key] || key;
}

function windowLabel(activeWindow, activeFile) {
    if (activeWindow === 'live') {
        return activeFile ? `Live — ${fileLabel(activeFile)}` : 'Live tab';
    }
    return fileLabel(activeWindow || activeFile);
}

/**
 * Live activity feed driven by Yjs awareness (typing, active tab/file)
 * and optional game-action events from STOMP.
 */
const LiveActivityPanel = ({ awareness, localClientId, gameActions = [] }) => {
    const [presence, setPresence] = useState([]);

    const refreshPresence = useCallback(() => {
        if (!awareness) return;
        const states = awareness.getStates();
        const rows = [];
        states.forEach((state, clientId) => {
            if (!state?.user) return;
            if (clientId === localClientId) return;
            rows.push({
                clientId,
                user: state.user,
                activeWindow: state.activeWindow,
                activeFile: state.activeFile,
                watchingPlayer: state.watchingPlayer,
                typing: state.typing,
                typingPreview: state.typingPreview || '',
            });
        });
        rows.sort((a, b) => a.user.localeCompare(b.user));
        setPresence(rows);
    }, [awareness, localClientId]);

    useEffect(() => {
        if (!awareness) return;
        refreshPresence();
        awareness.on('change', refreshPresence);
        return () => awareness.off('change', refreshPresence);
    }, [awareness, refreshPresence]);

    const hasContent = presence.length > 0 || gameActions.length > 0;

    return (
        <div className="flex min-h-0 flex-col border-b border-white/10 shrink-0 max-h-64">
            <div className="shrink-0 px-4 py-2.5 border-b border-white/5">
                <h2 className="text-[10px] font-light uppercase tracking-widest text-white/50">
                    Live Activity
                </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                {!hasContent && (
                    <p className="text-[9px] uppercase tracking-widest text-white/20">
                        Waiting for player activity…
                    </p>
                )}
                {presence.map((p) => (
                    <div
                        key={p.clientId}
                        className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 space-y-1"
                    >
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/70 shrink-0 animate-pulse" />
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400/80">
                                {p.user}
                            </span>
                            {p.typing && (
                                <span className="text-[8px] uppercase tracking-widest text-emerald-400/60 border border-emerald-500/20 px-1 rounded">
                                    typing
                                </span>
                            )}
                        </div>
                        <p className="text-[9px] text-white/40 uppercase tracking-widest">
                            {p.activeWindow === 'live' && p.watchingPlayer
                                ? `Watching ${p.watchingPlayer} — ${fileLabel(p.activeFile)}`
                                : windowLabel(p.activeWindow, p.activeFile)}
                        </p>
                        {p.typing && p.typingPreview && (
                            <pre className="text-[9px] font-mono text-white/55 leading-relaxed whitespace-pre-wrap break-all max-h-16 overflow-hidden">
                                {p.typingPreview}
                            </pre>
                        )}
                    </div>
                ))}
                {gameActions.slice(0, 8).map((action, idx) => (
                    <div
                        key={`action-${idx}-${action.time}`}
                        className="rounded-lg border border-red-500/15 bg-red-500/[0.04] px-3 py-2"
                    >
                        <p className="text-[9px] text-white/50 leading-relaxed">{action.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LiveActivityPanel;
