import React from 'react';

const CodeEditorWindow = ({ title, code, onChange, language = "Python", lineCount = 20, readOnly = false }) => {
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

    return (
        <div className="flex flex-col h-full border border-white/10 bg-[#080808]/40 overflow-hidden rounded-lg">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 bg-black/40">
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/70" />
                    <span className="text-[10px] font-medium uppercase tracking-widest text-white/60">{title}</span>
                </div>
                <div className="flex items-center gap-2">
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
                    value={code}
                    onChange={readOnly ? undefined : (e) => onChange(e.target.value)}
                    readOnly={readOnly}
                    spellCheck="false"
                    className={`flex-1 resize-none bg-transparent py-2 pl-3 font-mono text-xs leading-6 outline-none scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent ${readOnly ? 'text-purple-100/70 cursor-default select-text' : 'text-cyan-50/90'}`}
                    style={{ tabSize: 4 }}
                />
            </div>
        </div>
    );
};

export default CodeEditorWindow;
