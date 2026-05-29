import React, { useState } from 'react';
import { Input, Button } from '../components/ui/platform-components';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import Lottie from 'lottie-react';
import { useRef } from 'react';
import errorAnimation from '../assets/animations/404.json';
import chatAnimation from '../assets/animations/people.json';
import timerAnimation from '../assets/animations/countdown.json';
import saveAnimation from '../assets/animations/save.json';
import playExplainAnimation from '../assets/animations/howtoplay.json';
import recordAnimation from '../assets/animations/recording.json';
import compileAnimation from '../assets/animations/compile.json';
import emergencyAnimation from '../assets/animations/emergency.json';
// ─── Rules Modal ──────────────────────────────────────────────────────────────
function RulesModal({ onClose }) {
    const [activeTab, setActiveTab] = useState('overview');
    const statsRef = useRef();
    const tabs = [
        { id: 'overview',  label: 'Overview'  },
        { id: 'roles',     label: 'Roles'     },
        { id: 'mechanics', label: 'Mechanics' },
        { id: 'winning',   label: 'Win / Lose'},
    ];
   const stats = [
    {
        animation: timerAnimation,
        filter: 'invert(1) sepia(1) saturate(5) hue-rotate(0deg)',
        label: '3 Minutes',
        sub: 'per session',
    },
    {
        animation: errorAnimation,
        filter: 'invert(1) sepia(1) saturate(5) hue-rotate(0deg)',
        label: '5 Files',
        sub: 'to repair',
    },
    {
        animation: chatAnimation,
        filter: 'invert(1) sepia(1) saturate(5) hue-rotate(155deg)',
        label: '4 Players',
        sub: 'per room',
    },
];
    const content = {
        overview: (
            <div className="space-y-4">
                <p className="text-sm font-light text-white/70 leading-relaxed">
                    <span className="text-cyan-400 font-medium">CodePoster</span> is a real-time multiplayer coding game. Up to 4 players join a room and are secretly assigned roles. Crewmates must repair corrupted Python algorithm files before the 3-minute lockdown expires — but one player among them is the Imposter.
                </p>
                <div className="grid grid-cols-3 gap-3 pt-2">
                 {stats.map(stat => (
    <div key={stat.label} className="flex flex-col items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] py-3">
        {stat.animation ? (
            <Lottie
                animationData={stat.animation}
                loop={true}
                autoplay={true}
                style={{ width: 32, height: 32, filter: stat.filter }}
            />
        ) : (
            <span className="text-xl">{stat.icon}</span>
        )}
        <span className="text-xs font-semibold text-white/80">{stat.label}</span>
        <span className="text-[10px] text-white/35 uppercase tracking-widest">{stat.sub}</span>
    </div>
))}
                </div>
            </div>
        ),
        roles: (
            <div className="space-y-3">
                {[
                    {
                        color: 'emerald',
                        border: 'border-emerald-500/20',
                        bg: 'bg-emerald-500/[0.06]',
                        label: 'Crewmate',
                        badge: 'bg-emerald-500/20 text-emerald-400',
                        icon: '🧑‍💻',
                        desc: 'Repair all 5 corrupted Python files before time runs out. Use the Live tab to watch teammates. Call an Emergency Meeting if you suspect the Imposter. Vote wisely on Compile requests.',
                    },
                    {
                        color: 'red',
                        border: 'border-red-500/20',
                        bg: 'bg-red-500/[0.06]',
                        label: 'Imposter',
                        badge: 'bg-red-500/20 text-red-400',
                        icon: '🕵️',
                        desc: 'Blend in. Disrupt the crew using your 3 sabotage abilities: Blackout (blinds editors 8s), File Lock (read-only 12s), and Reset (wipes all code). Vote strategically on Compile requests to waste time or trigger a failure.',
                    },
                ].map(role => (
                    <div key={role.label} className={`rounded-xl border ${role.border} ${role.bg} p-4`}>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-xl">{role.icon}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${role.badge}`}>
                                {role.label}
                            </span>
                        </div>
                        <p className="text-xs font-light text-white/60 leading-relaxed">{role.desc}</p>
                    </div>
                ))}
            </div>
        ),
        mechanics: (
            <div className="space-y-3">
               {[
    {
        animation: compileAnimation,
        filter: 'invert(1) sepia(1) saturate(5) hue-rotate(155deg)',
        title: 'Compile Vote',
        color: 'text-cyan-400',
        desc: 'Any player can call a Compile Vote. Everyone must Approve or Reject. Majority wins. A passing compile with all tasks done ends the game in a Crewmate victory — but the Imposter can vote Approve on broken code to waste the build.',
    },
    {
        animation: emergencyAnimation,
     filter: 'brightness(0) saturate(100%) invert(59%) sepia(68%) saturate(1038%) hue-rotate(314deg) brightness(103%)',
    title: 'Emergency Meeting',
        color: 'text-red-400',
        desc: 'Call a meeting at any time to vote and eject a suspected Imposter. One chance per player. Choose carefully — ejecting an innocent crewmate gives the Imposter the advantage.',
    },
    {
        animation: recordAnimation,
    filter: 'brightness(0) saturate(100%) invert(60%) sepia(40%) saturate(800%) hue-rotate(240deg) brightness(105%)',
       title: 'Live Spectator',
        color: 'text-purple-300',
        desc: 'Switch to the Live tab and select any teammate to watch their editor in real time, read-only. Use it to verify they are actually coding — or catch the Imposter doing nothing.',
    },
    {
        animation: saveAnimation,
       filter: 'brightness(0) saturate(100%) invert(85%) sepia(80%) saturate(900%) hue-rotate(15deg) brightness(103%)',
       title: 'Performance Data',
        color: 'text-yellow-400',
        desc: 'After every session your stats are recorded — task completion rate, time-to-completion, code accuracy, and a Deadline Performance Rating. Educators can view class-wide analytics.',
    },
].map(m => (
    <div key={m.title} className="flex gap-3 rounded-lg border border-white/8 bg-white/[0.02] p-3">
        <div className="shrink-0 mt-0.5 w-6 h-6 flex items-center justify-center">
            {m.animation ? (
                <Lottie
                    animationData={m.animation}
                    loop={true}
                    autoplay={true}
                    style={{ width: 24, height: 24, filter: m.filter }}
                />
            ) : (
                <span className="text-lg">{m.icon}</span>
            )}
        </div>
        <div>
            <p className={`text-xs font-semibold mb-1 ${m.color}`}>{m.title}</p>
            <p className="text-xs font-light text-white/55 leading-relaxed">{m.desc}</p>
        </div>
    </div>
))}
            </div>
        ),
        winning: (
            <div className="space-y-3">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">✓ Crewmates Win If...</p>
                    <ul className="space-y-1.5">
                        {[
                            'All 5 tasks are completed and a Compile Vote passes.',
                            'The Imposter is correctly identified and ejected through a vote.',
                        ].map(c => (
                            <li key={c} className="flex items-start gap-2 text-xs font-light text-white/60">
                                <span className="text-emerald-500 mt-0.5 shrink-0">—</span>{c}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2">✗ Imposter Wins If...</p>
                    <ul className="space-y-1.5">
                        {[
                            'The 3-minute countdown reaches zero.',
                            'An innocent crewmate is ejected and the Imposter remains.',
                            'A Compile Vote(or 2 depends on difficulty) passes on broken or incomplete code.',
                        ].map(c => (
                            <li key={c} className="flex items-start gap-2 text-xs font-light text-white/60">
                                <span className="text-red-500 mt-0.5 shrink-0">—</span>{c}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-white/30">Remember</p>
                    <p className="text-xs font-light text-white/50 mt-1">Your performance is recorded every session.<br/>Trust no one. Code fast. Vote smart.</p>
                </div>
            </div>
        ),
    };

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ animation: 'fadeIn 0.25s ease' }}
        >
            {/* Dark overlay */}
            <div
                className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-2xl overflow-hidden"
                style={{ animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)' }}
            >
                {/* Top accent bar */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8">
                    <div>
                        <h2 className="text-base font-semibold tracking-wide text-white">How to Play</h2>
                        <p className="text-[10px] uppercase tracking-widest text-white/30 mt-0.5">CodePoster — Mission Rules</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white/80 hover:border-white/20 transition-all text-sm"
                    >
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/8 px-6 gap-1 pt-3">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3 pb-2.5 text-[11px] font-medium uppercase tracking-widest transition-all border-b-2 ${
                                activeTab === tab.id
                                    ? 'border-cyan-500 text-cyan-400'
                                    : 'border-transparent text-white/35 hover:text-white/60'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div
                    className="px-6 py-5 overflow-y-auto max-h-[380px]"
                    key={activeTab}
                    style={{ animation: 'fadeIn 0.2s ease' }}
                >
                    {content[activeTab]}
                </div>

                {/* Footer */}
                <div className="px-6 pb-5 pt-3 border-t border-white/8 flex items-center justify-between">
                    <div className="flex gap-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`h-1.5 rounded-full transition-all ${
                                    activeTab === tab.id ? 'w-5 bg-cyan-500' : 'w-1.5 bg-white/15'
                                }`}
                            />
                        ))}
                    </div>
                    <button
                        onClick={() => {
                            const idx = tabs.findIndex(t => t.id === activeTab);
                            if (idx < tabs.length - 1) {
                                setActiveTab(tabs[idx + 1].id);
                            } else {
                                onClose();
                            }
                        }}
                        className="px-4 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[11px] font-medium uppercase tracking-widest hover:bg-cyan-500/20 transition-all"
                    >
                        {activeTab === 'winning' ? 'Got it' : 'Next →'}
                    </button>
                </div>
            </div>

            {/* Keyframe styles */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(24px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0)     scale(1);    }
                }
            `}</style>
        </div>
    );
}

// ─── Lobby Page ───────────────────────────────────────────────────────────────
export default function LobbyPage({ onConnect, isConnected: propsIsConnected = false }) {
    const navigate = useNavigate();
    const { connect, isConnected: socketIsConnected } = useSocket();
    const isConnected = propsIsConnected || socketIsConnected;
    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [roomKey, setRoomKey] = useState('');
    const [showRules, setShowRules] = useState(false);

    const handleNavigate = (path, options = {}) => {
        setIsLoading(true);
        setTimeout(() => {
            navigate(path, options);
        }, 1200);
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await connect(username);
            if (onConnect && onConnect(username)) {
                handleNavigate(`/waiting/${roomKey}`);
            }
        } catch (err) {
            alert('Failed to connect to server. Please try again.');
            setIsLoading(false);
        }
    };

    const handleInitializeRoom = async () => {
        setIsLoading(true);
        try {
            await connect(username);
            if (onConnect && onConnect(username)) {
                handleNavigate('/create-room', { state: { roomKey } });
            }
        } catch (err) {
            alert('Failed to connect to server. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-8">
            <div className={`w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-xl sm:p-10 transition-opacity duration-500 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                <div className="flex flex-col gap-8">

                    {/* Header */}
                    <div className="flex flex-col gap-2 text-center">
                        <h1 className="text-3xl font-extralight tracking-tight text-white sm:text-4xl">
                            The Lobby
                        </h1>
                        <p className="text-sm font-light leading-relaxed text-white/45 max-w-[280px] mx-auto">
                            Join Friends Or Create a new room.
                        </p>
                        {/* How to play button */}
                        <button
                            onClick={() => setShowRules(true)}
                            className="mx-auto mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-cyan-400 cursor-pointer hover:text-cyan-400 transition-colors"
                        >
                              <Lottie
               
                animationData={playExplainAnimation}
                loop={true}
                autoplay={true}
                style={{ width: 20, height: 20, filter: 'invert(1) sepia(1) saturate(5) hue-rotate(155deg)' }}
            />
                            How to play
                        </button>
                    </div>

                    <div className="flex flex-col gap-6">
                        <form onSubmit={handleJoin} className="flex flex-col gap-4">
                            <Input
                                label="Username"
                                placeholder="IsThatYouElliot"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                            <Input
                                label="Your Hash Key Room"
                                placeholder="try-me-01?-lol"
                                value={roomKey}
                                onChange={(e) => setRoomKey(e.target.value)}
                                required
                            />
                            <Button primary type="submit" disabled={isLoading}>
                                {isLoading ? 'Loading...' : 'Join Room'}
                            </Button>
                        </form>

                        <div className="relative flex items-center">
                            <div className="flex-1 border-t border-white/10" />
                            <span className="px-4 text-[10px] uppercase tracking-[0.2em] text-white/25">or</span>
                            <div className="flex-1 border-t border-white/10" />
                        </div>

                        <Button onClick={handleInitializeRoom} disabled={isLoading}>
                            {isLoading ? 'Loading...' : 'Initialize New Room'}
                        </Button>

                        <div className="relative flex items-center">
                            <div className="flex-1 border-t border-white/10" />
                            <span className="px-4 text-[10px] uppercase tracking-[0.2em] text-white/25">stats</span>
                            <div className="flex-1 border-t border-white/10" />
                        </div>

                        <Button onClick={() => handleNavigate('/profile')} disabled={isLoading}>
                            View Profile & Stats
                        </Button>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-white/10 pt-5 text-[10px] font-light uppercase tracking-widest text-white/35">
                        <span>Uplink: {isConnected ? 'ESTABLISHED' : 'DISCONNECTED'}</span>
                        <span className="tabular-nums">Status: {username ? username : 'No User'}</span>
                    </div>
                </div>
            </div>

            {/* Rules modal */}
            {showRules && <RulesModal onClose={() => setShowRules(false)} />}

            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-500 opacity-100">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="h-12 w-12 border-4 border-red-700 border-t-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-0 h-12 w-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
                        </div>
                        <p className="text-cyan-300 font-mono text-sm uppercase tracking-widest animate-pulse">
                            Establishing Connection...
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}