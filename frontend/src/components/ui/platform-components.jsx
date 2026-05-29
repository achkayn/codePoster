import React from 'react';

export const GlassCard = ({ children, className = "" }) => (
    <div className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl ${className}`}>
        {children}
    </div>
);

export const Input = ({ label, ...props }) => (
    <div className="flex flex-col gap-1.5 w-full">
        {label && <label className="text-[10px] font-light uppercase tracking-widest text-white/50">{label}</label>}
        <input
            {...props}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-light text-white outline-none focus:border-white/30 focus:bg-white/10 transition-all duration-300 placeholder:text-white/20"
        />
    </div>
);

export const Button = ({ children, primary = false, className = "", disabled, ...props }) => (
    <button
        {...props}
        disabled={disabled}
        className={`rounded-lg px-6 py-2.5 text-sm font-light tracking-tight transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50 disabled:cursor-wait disabled:hover:bg-inherit ${primary
                ? "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                : "text-white/70 hover:bg-white/5 border border-white/5"
            } ${className}`}
    >
        {children}
    </button>
);
