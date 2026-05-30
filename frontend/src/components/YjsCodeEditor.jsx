import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * YjsCodeEditor — binds to a shared Y.Text from the room-level Y.Doc.
 *
 * Props:
 *  ytext         – shared Y.Text for this file (required)
 *  ydoc          – parent Y.Doc (for transactions)
 *  awareness     – y-webrtc awareness instance (presence / typing)
 *  fileKey       – file id for awareness (e.g. "neural_hash")
 *  username      – local player name
 *  initialCode   – unused here; seeding is handled by YjsRoomProvider
 *  title         – file name shown in the header
 *  language      – language label (default: "Python")
 *  lineCount     – gutter lines (default: 30)
 *  readOnly      – viewer mode
 */
const YjsCodeEditor = ({
    ytext,
    ydoc,
    awareness = null,
    fileKey = '',
    username = '',
    title,
    language = 'Python',
    lineCount = 30,
    readOnly = false,
    onKeyDown,
}) => {
    const [code, setCode] = useState('');
    const textareaRef = useRef(null);
    const typingTimerRef = useRef(null);

    // Sync from Y.Text on mount and remote edits
    useEffect(() => {
        if (!ytext) return;

        setCode(ytext.toString());

        const observer = (event, tr) => {
            const newVal = ytext.toString();
            if (readOnly || tr.local) {
                setCode(newVal);
                return;
            }
            const ta = textareaRef.current;
            if (!ta) {
                setCode(newVal);
                return;
            }
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            setCode(newVal);
            requestAnimationFrame(() => {
                if (ta) ta.setSelectionRange(start, end);
            });
        };

        ytext.observe(observer);
        return () => ytext.unobserve(observer);
    }, [ytext, readOnly]);

    const publishTyping = useCallback((preview, isTyping) => {
        if (!awareness || !username || !fileKey) return;
        const prev = awareness.getLocalState() || {};
        awareness.setLocalState({
            ...prev,
            user: username,
            fileKey,
            typing: isTyping,
            typingPreview: isTyping ? preview : '',
        });
    }, [awareness, username, fileKey]);

    const handleChange = useCallback((e) => {
        if (readOnly || !ytext || !ydoc) return;

        const newVal = e.target.value;
        const oldVal = ytext.toString();
        if (newVal === oldVal) return;

        let s = 0;
        while (s < oldVal.length && s < newVal.length && oldVal[s] === newVal[s]) s++;

        let oe = oldVal.length;
        let ne = newVal.length;
        while (oe > s && ne > s && oldVal[oe - 1] === newVal[ne - 1]) { oe--; ne--; }

        ydoc.transact(() => {
            if (oe > s) ytext.delete(s, oe - s);
            if (ne > s) ytext.insert(s, newVal.slice(s, ne));
        });

        setCode(newVal);

        const cursor = e.target.selectionStart ?? newVal.length;
        const previewStart = Math.max(0, cursor - 48);
        const preview = newVal.slice(previewStart, cursor + 12);
        publishTyping(preview, true);

        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => publishTyping('', false), 1500);
    }, [readOnly, ytext, ydoc, publishTyping]);

    useEffect(() => () => clearTimeout(typingTimerRef.current), []);

    if (!ytext) {
        return (
            <div className="flex h-full items-center justify-center text-white/20 text-xs uppercase tracking-widest">
                Syncing document…
            </div>
        );
    }

    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

    return (
        <div className="flex flex-col h-full border border-white/10 bg-[#080808]/40 overflow-hidden rounded-lg">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 bg-black/40">
                <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${readOnly ? 'bg-purple-500/70 animate-pulse' : 'bg-emerald-500/70'}`} />
                    <span className="text-[10px] font-medium uppercase tracking-widest text-white/60">{title}</span>
                </div>
                <div className="flex items-center gap-2">
                    {readOnly && <span className="text-[8px] uppercase tracking-widest text-purple-400/60 border border-purple-500/20 px-1.5 py-0.5 rounded">live</span>}
                    <span className="h-1 w-1 rounded-full bg-cyan-400/90" />
                    <span className="text-[9px] font-medium uppercase tracking-widest text-white/40">{language}</span>
                </div>
            </div>

            <div className="relative flex-1 flex overflow-hidden">
                <div className="w-10 shrink-0 py-2 pr-2 text-right font-mono text-[10px] text-white/10 select-none leading-6 bg-black/20">
                    {lineNumbers.map((n) => (
                        <div key={n} className="h-6">{n}</div>
                    ))}
                </div>

                <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={handleChange}
                    onKeyDown={onKeyDown}
                    readOnly={readOnly}
                    spellCheck={false}
                    className={`flex-1 resize-none bg-transparent py-2 pl-3 font-mono text-xs leading-6 outline-none scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent ${
                        readOnly ? 'text-purple-100/70 cursor-default select-text' : 'text-cyan-50/90'
                    }`}
                    style={{ tabSize: 4 }}
                />
            </div>
        </div>
    );
};

export default YjsCodeEditor;
