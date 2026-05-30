import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/platform-components';
import gsap from 'gsap';

const RevealPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const {
        outcome = 'victory',
        imposterName = 'Vector',
        role = 'crewmate',
        roomId,
        username,
    } = location.state || {};

    const [session, setSession] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);

    const [showContent, setShowContent] = useState(false);
    const containerRef = useRef(null);
    const contentRef = useRef(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowContent(true);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (showContent && contentRef.current) {
            gsap.fromTo(contentRef.current,
                { opacity: 0, scale: 0.9, y: 20 },
                { opacity: 1, scale: 1, y: 0, duration: 1.2, ease: "power3.out" }
            );
        }
    }, [showContent]);

    useEffect(() => {
        if (!roomId || !showContent) return;
        setLoadingStats(true);
        const timer = setTimeout(() => {
            fetch(`http://localhost:8080/api/analytics/session/${roomId}`)
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    setSession(data);
                    setLoadingStats(false);
                })
                .catch(() => setLoadingStats(false));
        }, 2000);
        return () => clearTimeout(timer);
    }, [roomId, showContent]);

    const isVictory = outcome === 'victory';
    const resultTitle = isVictory ? 'VICTORY' : 'DEFEAT';
    const mainText = isVictory ? 'MISSION SUCCESS' : 'MISSION FAILED';
    const subText = isVictory ? 'The threat has been neutralized.' : 'The imposter has successfully compromised the network.';
    const myStats = session?.players?.find(
        p => p.username === username) || null;

    return (
        <div ref={containerRef} className="flex min-h-screen w-full flex-col items-center justify-center bg-black text-white overflow-hidden relative font-sans">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-20 transition-colors duration-1000 ${isVictory ? 'bg-cyan-500' : 'bg-red-500'}`}></div>
                <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] opacity-20 transition-colors duration-1000 ${isVictory ? 'bg-blue-600' : 'bg-rose-600'}`}></div>

                {/* Large Background Text */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none select-none opacity-[0.05]">
                    <h2 className={`text-[20vw] font-black italic tracking-tighter ${isVictory ? 'text-cyan-500' : 'text-red-500'}`}>
                        {resultTitle}
                    </h2>
                </div>
            </div>

            {showContent && (
                <div
                    ref={contentRef}
                    className="relative z-10 flex flex-col items-center max-w-2xl px-6 text-center"
                >
                    {/* Status Badge */}
                    <div
                        className={`mb-6 px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-[0.3em] ${isVictory ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}
                    >
                        {outcome}
                    </div>

                    {/* Title */}
                    <h1 className={`text-5xl md:text-7xl font-extralight tracking-tighter mb-4 ${isVictory ? 'text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'text-white drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]'}`}>
                        {mainText}
                    </h1>

                    <p className="text-white/50 text-sm md:text-base font-light tracking-widest uppercase mb-12">
                        {subText}
                    </p>

                    {/* Reveal Card */}
                    <div className="w-full max-w-md bg-white/[0.03] border border-white/10 rounded-2xl p-8 backdrop-blur-md relative overflow-hidden group">
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${isVictory ? 'bg-cyan-500' : 'bg-red-500'}`}></div>

                        <span className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">{isVictory ? 'Subject Neutralized' : 'Network Compromised'}</span>
                        <div className="flex flex-col items-center gap-4">
                            <div className={`w-20 h-20 rounded-2xl border flex items-center justify-center text-4xl font-light ${isVictory ? 'border-cyan-500/30 bg-cyan-500/5 text-cyan-400' : 'border-red-500/30 bg-red-500/5 text-red-500'}`}>
                                {imposterName.charAt(0)}
                            </div>
                            <div className="text-center">
                                <h2 className="text-2xl font-light tracking-widest text-white mb-1 uppercase bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">{imposterName}</h2>
                                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isVictory ? 'text-red-400/80' : 'text-red-500'}`}>Wore the Imposter Mask</span>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                            <div className="text-left">
                                <span className="block text-[9px] uppercase tracking-widest text-white/30">Your Role</span>
                                <span className="text-xs font-medium text-white/70 uppercase">{role}</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-[9px] uppercase tracking-widest text-white/30">Status</span>
                                <span className={`text-xs font-medium uppercase ${isVictory ? 'text-emerald-400' : 'text-red-400'}`}>{isVictory ? 'Recovered' : 'Eliminated'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 flex flex-col sm:flex-row gap-4 w-full justify-center">
                        <Button className="px-8 h-12 text-xs uppercase tracking-widest" onClick={() => navigate('/lobby')}>
                            Return to Lobby
                        </Button>
                        <Button primary className={`px-8 h-12 text-xs uppercase tracking-widest ${isVictory ? 'border-cyan-500/40 text-cyan-200' : 'border-red-500/40 text-red-200'}`} onClick={() => navigate('/')}>
                            New Session
                        </Button>
                    </div>

                    {(loadingStats || myStats) && (
                        <div className="mt-12 w-full max-w-2xl">
                            <h3 className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-4 text-center">
                                Your Performance
                            </h3>

                            {loadingStats && (
                                <p className="text-center text-xs text-white/30 animate-pulse uppercase tracking-widest">
                                    Loading stats...
                                </p>
                            )}

                            {myStats && (
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            {
                                                label: 'Tasks Done',
                                                val: myStats.tasksCompleted?.length ?? 0,
                                                color: 'text-emerald-400'
                                            },
                                            {
                                                label: 'File Switches',
                                                val: myStats.fileSwitches ?? 0,
                                                color: 'text-cyan-400'
                                            },
                                            {
                                                label: 'Voted Correctly',
                                                val: myStats.votedCorrectly ? 'Yes' : 'No',
                                                color: myStats.votedCorrectly
                                                    ? 'text-emerald-400' : 'text-red-400'
                                            },
                                        ].map(s => (
                                            <div
                                                key={s.label}
                                                className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center"
                                            >
                                                <p className={`text-2xl font-mono font-medium ${s.color}`}>
                                                    {s.val}
                                                </p>
                                                <p className="text-[9px] text-white/25 uppercase tracking-widest mt-1">
                                                    {s.label}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {myStats.compilationResults &&
                                     Object.keys(myStats.compilationResults).length > 0 && (
                                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                                            <p className="text-[9px] uppercase tracking-widest text-white/30 mb-3">
                                                Compile Results
                                            </p>
                                            <div className="space-y-2">
                                                {Object.entries(myStats.compilationResults)
                                                    .map(([task, verdict]) => (
                                                    <div
                                                        key={task}
                                                        className="flex items-center justify-between"
                                                    >
                                                        <span className="text-xs font-mono text-white/50">
                                                            {task}.py
                                                        </span>
                                                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                                                            verdict === 'ACCEPTED'
                                                                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                                                                : 'text-red-400 border-red-500/30 bg-red-500/10'
                                                        }`}>
                                                            {verdict}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {myStats.timePerFile &&
                                     Object.keys(myStats.timePerFile).length > 0 && (
                                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                                            <p className="text-[9px] uppercase tracking-widest text-white/30 mb-3">
                                                Time Per File
                                            </p>
                                            <div className="space-y-2">
                                                {Object.entries(myStats.timePerFile)
                                                    .map(([task, secs]) => (
                                                    <div
                                                        key={task}
                                                        className="flex items-center justify-between"
                                                    >
                                                        <span className="text-xs font-mono text-white/50">
                                                            {task}.py
                                                        </span>
                                                        <span className="text-xs font-mono text-cyan-400/70">
                                                            {secs}s
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        </div>
    );
};

export default RevealPage;
