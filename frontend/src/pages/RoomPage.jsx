import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Button } from '../components/ui/platform-components';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import YjsCodeEditor from '../components/YjsCodeEditor';
import LiveActivityPanel from '../components/LiveActivityPanel';
import { useSocket } from '../context/SocketContext';
import { YjsRoomProvider, useYjsRoom } from '../context/YjsRoomContext';

// ─── Chat message bubble ──────────────────────────────────────────────────────
const ChatMessage = memo(({ user, text, time }) => (
    <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400/80">{user}</span>
            <span className="text-[9px] text-white/25 tabular-nums">{time}</span>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3 text-xs font-light leading-relaxed text-white/85">
            {text}
        </div>
    </div>
));

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

const GAME_DURATION = 1800;

const INITIAL_CODE = {
    neural_hash:
`# TASK: Implement secure_hash(data)
# Should return a 64-char hex string using SHA-256

import hashlib

def secure_hash(data: str) -> str:
    # YOUR CODE HERE
    pass

if __name__ == "__main__":
    result = secure_hash("nexus-core")
    print(result)`,

    data_sort:
`# TASK: Fix quicksort — it loses duplicate values

def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[0]
    left  = [x for x in arr[1:] if x < pivot]   # BUG: drops duplicates
    right = [x for x in arr[1:] if x > pivot]   # BUG: drops duplicates
    return quicksort(left) + [pivot] + quicksort(right)

if __name__ == "__main__":
    print(quicksort([3, 6, 8, 10, 1, 2, 1]))
    # Expected: [1, 1, 2, 3, 6, 8, 10]`,

    auth_check:
`# TASK: Implement token_verify(token, secret)
# Return True if HMAC-SHA256(secret, b"verify") matches token

import hmac, hashlib

def token_verify(token: str, secret: str) -> bool:
    # YOUR CODE HERE
    pass

if __name__ == "__main__":
    key = b"nexus-key"
    expected = hmac.new(key, b"verify", hashlib.sha256).hexdigest()
    print(token_verify(expected, "nexus-key"))  # Should print: True`,

    key_rotation:
`# TASK: Fix key_rotation — rotate bytes LEFT by n positions
# Currently rotates RIGHT instead of LEFT

def key_rotation(key: bytes, n: int) -> bytes:
    n = n % len(key)
    return key[-n:] + key[:-n]   # BUG: this is a right rotation

if __name__ == "__main__":
    result = key_rotation(b"ABCDEFGH", 2)
    print(result)  # Expected: b"CDEFGHAB"`,

    grid_scan:
`# TASK: Implement pattern_match(grid, pattern)
# Return list of (row, col) where pattern starts in each row

def pattern_match(grid: list, pattern: str) -> list:
    # YOUR CODE HERE
    pass

if __name__ == "__main__":
    g = ["axnexus", "bznexus", "cwnone"]
    print(pattern_match(g, "nexus"))
    # Expected: [(0, 2), (1, 2)]`,
};

const INITIAL_TASKS = [
    { id: 1, label: 'Implement secure_hash()',    done: false },
    { id: 2, label: 'Fix quicksort duplicates',   done: false },
    { id: 3, label: 'Implement token_verify()',   done: false },
    { id: 4, label: 'Fix key_rotation direction', done: false },
    { id: 5, label: 'Implement pattern_match()',  done: false },
];

const TASK_KEYS = ['neural_hash', 'data_sort', 'auth_check', 'key_rotation', 'grid_scan'];

// ─── Sabotage ability definitions ─────────────────────────────────────────────
const SABOTAGE_TYPES = [
    {
        type: 'BLACKOUT',
        icon: '🕶',
        label: 'Blackout',
        description: 'Blinds all editors for 8s',
        cooldown: 40,
    },
    {
        type: 'FILE_LOCK',
        icon: '🔒',
        label: 'File Lock',
        description: 'Freezes all editors read-only for 12s',
        cooldown: 50,
    },
    {
        type: 'RESET',
        icon: '💀',
        label: 'Reset',
        description: 'Wipes all code files back to starter',
        cooldown: 60,
    },
];

const CompilerView = () => {
    const [compiling, setCompiling] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [selectedEnv, setSelectedEnv] = useState('PROD');

    const handleCompile = () => {
        setCompiling(true);
        setProgress(0);
        setResult(null);

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setCompiling(false);
                    setResult({
                        status: 'SUCCESS',
                        output: 'Build successful. Artifacts deployed to nexus-core-v1.0.4. \n[LOG] Initializing kernel... \n[LOG] Memory parity check passed. \n[LOG] Network handshake complete.',
                        timestamp: new Date().toLocaleTimeString()
                    });
                    return 100;
                }
                return prev + 5;
            });
        }, 150);
    };

    return (
        <div className="flex h-full flex-col gap-6 p-8 overflow-y-auto">
            <div className="flex flex-col gap-2">
                <h2 className="text-xl font-light uppercase tracking-[0.2em] text-cyan-400/90">Compiler Interface</h2>
                <p className="text-[10px] uppercase tracking-widest text-white/35">Authorize and validate code deployments</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-white/10 bg-black/40 p-6 space-y-6">
                    <div className="space-y-4">
                        <label className="block text-[10px] uppercase tracking-widest text-white/50">Execution Environment</label>
                        <div className="flex gap-2">
                            {['DEV', 'STAGING', 'PROD'].map(env => (
                                <button
                                    key={env}
                                    onClick={() => setSelectedEnv(env)}
                                    className={`flex-1 py-3 px-4 rounded-lg border text-[10px] font-medium transition-all ${selectedEnv === env
                                        ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400'
                                        : 'border-white/5 bg-white/[0.02] text-white/40 hover:bg-white/5'}`}
                                >
                                    {env}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] uppercase tracking-widest text-white/50">Compilation Flags</label>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                                <input type="checkbox" defaultChecked className="accent-cyan-500" />
                                <span className="text-[10px] text-white/60">--optimize-level 3</span>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                                <input type="checkbox" defaultChecked className="accent-cyan-500" />
                                <span className="text-[10px] text-white/60">--strict-nulls</span>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                                <input type="checkbox" className="accent-cyan-500" />
                                <span className="text-[10px] text-white/60">--verbose-logs</span>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                                <input type="checkbox" className="accent-cyan-500" />
                                <span className="text-[10px] text-white/60">--debug-symbols</span>
                            </div>
                        </div>
                    </div>

                    <Button
                        primary
                        className="w-full h-12 text-xs tracking-widest uppercase mt-4"
                        onClick={handleCompile}
                        disabled={compiling}
                    >
                        {compiling ? `Compiling... ${progress}%` : 'Execute Build'}
                    </Button>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/60 p-0 flex flex-col overflow-hidden shadow-inner ring-1 ring-white/5">
                    <div className="border-b border-white/10 px-4 py-3 bg-white/[0.05] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/30"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/30"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/30"></div>
                            </div>
                            <span className="text-[10px] uppercase tracking-widest text-white/50 ml-2">Build Output</span>
                        </div>
                        {result && <span className="text-[9px] text-emerald-400/70 border border-emerald-500/30 px-2 py-0.5 rounded bg-emerald-500/10 uppercase font-bold tracking-tighter">Ready</span>}
                    </div>
                    <div className="flex-1 p-5 font-mono text-[11px] leading-relaxed overflow-y-auto bg-black/40">
                        {!compiling && !result && (
                            <div className="flex flex-col items-center justify-center h-full gap-4 opacity-20">
                                <div className="p-4 rounded-full border border-dashed border-white/20">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                                </div>
                                <span className="uppercase tracking-[0.25em] text-[9px] font-medium text-white/50">Awaiting Build Signal</span>
                            </div>
                        )}
                        {compiling && (
                            <div className="space-y-3">
                                <div className="flex gap-3">
                                    <span className="text-cyan-500/50">0x884</span>
                                    <div className="text-cyan-400/80 animate-pulse">[INFO] Scanning class path...</div>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-white/20">0x885</span>
                                    <div className="text-white/40">[INFO] Compiling modules...</div>
                                </div>
                                <div className="pt-4 px-2">
                                    <div className="flex justify-between text-[9px] uppercase tracking-widest text-white/30 mb-2">
                                        <span>Progress</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-cyan-500 h-full transition-all duration-150 shadow-[0_0_8px_rgba(6,182,212,0.5)]" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        {result && (
                            <div className="space-y-2 text-emerald-400/90 drop-shadow-[0_0_4px_rgba(52,211,153,0.3)]">
                                {result.output.split('\n').map((line, i) => (
                                    <div key={i} className="flex gap-3">
                                        <span className="text-white/10 select-none w-4">{i + 1}</span>
                                        <span className={line.includes('[LOG]') ? 'text-white/40' : ''}>{line}</span>
                                    </div>
                                ))}
                                <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-white/30 flex justify-between italic">
                                    <span>Build completed successfully</span>
                                    <span>{result.timestamp}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

function RoomPageContent({ username = 'Player', isConnected: propsIsConnected = false }) {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { subscribe, send, isConnected: socketIsConnected } = useSocket();
    const { getYText, awareness, resetAllFiles, ydoc } = useYjsRoom();
    const isConnected = propsIsConnected || socketIsConnected;

    const role       = location.state?.role || 'crewmate';
    const isImposter = role.toLowerCase() === 'imposter';
    const isCompiler = role.toLowerCase() === 'compiler';

    // ── State ─────────────────────────────────────────────────────────────────
    const [players,      setPlayers]      = useState([]);
    const [tasks,        setTasks]        = useState(INITIAL_TASKS);
    const [activeWindow, setActiveWindow] = useState('neural_hash');
    const [chosenPlayer, setChosenPlayer] = useState('');

    const [messages,  setMessages]  = useState([
        { user: 'SYSTEM', text: 'Neural link established. Encryption active.', time: '00:00' }
    ]);
    const [chatInput, setChatInput] = useState('');
    const messagesEndRef = useRef(null);

    // Timer
    const [timeLeft,  setTimeLeft]  = useState(GAME_DURATION);
    const timerRef     = useRef(null);
    const gameEndedRef = useRef(false);

    // Voting
    const [emergencyOpen,  setEmergencyOpen]  = useState(false);
    const [voteTarget,     setVoteTarget]     = useState(null);
    const [voted,          setVoted]          = useState(false);
    const [emergencyToast, setEmergencyToast] = useState(null);

    // Imposter sabotage — per-type cooldowns { type -> secondsLeft }
    const [selectedSabotage, setSelectedSabotage] = useState(null);
    const [cooldowns, setCooldowns] = useState(() =>
        Object.fromEntries(SABOTAGE_TYPES.map(s => [s.type, 0]))
    );
    const cooldownRefs = useRef({});

    // Crewmate: effects triggered by imposter
    const [isBlackout,   setIsBlackout]   = useState(false);
    const [isFileLocked, setIsFileLocked] = useState(false);
    const blackoutTimerRef  = useRef(null);
    const fileLockTimerRef  = useRef(null);

    // Task progress from other crewmates
    const [crewmateDoneCount, setCrewmateDoneCount] = useState(0);
    const taskCompleteSentRef = useRef(false);

    // Live code viewing (Yjs)
    const [watchingPlayer, setWatchingPlayer] = useState(null);
    const [liveActiveFile, setLiveActiveFile] = useState('neural_hash');

    // Live activity feed (game actions + awareness)
    const [gameActions, setGameActions] = useState([]);
    const localAwarenessClientId = awareness?.clientID ?? null;

    const addGameAction = useCallback((text) => {
        setGameActions(prev => [{ text, time: Date.now() }, ...prev].slice(0, 24));
    }, []);

    // Publish active tab / file to shared awareness
    useEffect(() => {
        if (!awareness) return;
        const prev = awareness.getLocalState() || {};
        awareness.setLocalState({
            ...prev,
            user: username,
            activeWindow,
            activeFile: activeWindow === 'live' ? liveActiveFile : activeWindow,
            watchingPlayer: activeWindow === 'live' ? watchingPlayer : null,
        });
    }, [awareness, username, activeWindow, liveActiveFile, watchingPlayer]);

    // Briefing modal
    const [showBriefing,      setShowBriefing]      = useState(true);
    const [briefingCountdown, setBriefingCountdown] = useState(8);
    const briefingTimerRef = useRef(null);

    // ── Compile vote state ────────────────────────────────────────────────────
    const [compileVoteOpen,    setCompileVoteOpen]    = useState(false);
    const [compileVotes,       setCompileVotes]       = useState({});   // { username -> 'yes'|'no' }
    const [myCompileVote,      setMyCompileVote]       = useState(null);
    const [compileVoteTimer,   setCompileVoteTimer]   = useState(15);
    const [showCompileResults, setShowCompileResults] = useState(false);
    const [compileResults, setCompileResults] = useState({});
    const [compileRunning,     setCompileRunning]     = useState(false);
    const [compileLogs,        setCompileLogs]        = useState([]);
    const compileVoteTimerRef  = useRef(null);
    const compileVotePlayersRef = useRef([]);  // snapshot of players at vote-start

    // ── Helpers ───────────────────────────────────────────────────────────────
    const addSystemMessage = useCallback((text) => {
        setMessages(prev => [...prev, {
            user: 'SYSTEM', text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
    }, []);

    const endGame = useCallback((outcome, imposterName) => {
        if (gameEndedRef.current) return;
        gameEndedRef.current = true;
        clearInterval(timerRef.current);
        Object.values(cooldownRefs.current).forEach(clearInterval);
        clearTimeout(blackoutTimerRef.current);
        clearTimeout(fileLockTimerRef.current);
        clearInterval(compileVoteTimerRef.current);
        navigate('/reveal', { state: { outcome, imposterName, role } });
    }, [navigate, role]);

    // ── Start cooldown for one sabotage type ──────────────────────────────────
    const startCooldown = useCallback((type, seconds) => {
        clearInterval(cooldownRefs.current[type]);
        setCooldowns(prev => ({ ...prev, [type]: seconds }));
        cooldownRefs.current[type] = setInterval(() => {
            setCooldowns(prev => {
                const next = prev[type] - 1;
                if (next <= 0) {
                    clearInterval(cooldownRefs.current[type]);
                    return { ...prev, [type]: 0 };
                }
                return { ...prev, [type]: next };
            });
        }, 1000);
    }, []);

    const triggerCompile = useCallback(async () => {
        setCompileVoteOpen(false);
        setCompileRunning(true);
        setCompileLogs([]);
        setShowCompileResults(false);
        addSystemMessage('⚙ Compile vote passed — running tests on all modules...');

        const taskKeys = TASK_KEYS;
        const results = {};

        for (let i = 0; i < taskKeys.length; i++) {
            const taskId = taskKeys[i];
            setCompileLogs(prev => [...prev, `[0x0${i + 1}] Testing ${taskId}.py...`]);

            const ytext = getYText(taskId);
            const code = ytext ? ytext.toString() : '';

            try {
                const response = await fetch('http://localhost:8080/api/compile/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        files: { 'solution.py': code },
                        taskId: taskId,
                        roomId: id,
                        username: username,
                    }),
                });
                const verdict = await response.text();
                results[taskId] = verdict.split('\n')[0].trim();
            } catch (err) {
                results[taskId] = 'RUNTIME_ERROR';
            }

            setCompileLogs(prev => [
                ...prev,
                `  → ${results[taskId]}`
            ]);
        }

        setCompileLogs(prev => [...prev, '[OK] All modules tested.']);
        setCompileRunning(false);
        setCompileResults(results);
        setShowCompileResults(true);
        addSystemMessage('Build report ready. Check the Compile Results panel.');

        setTasks(prev => prev.map((task, i) => {
            const taskId = taskKeys[i];
            return results[taskId] === 'ACCEPTED' ? { ...task, done: true } : task;
        }));
    }, [addSystemMessage, getYText, id, username]);

    // ── Resolve compile vote: tally and decide ────────────────────────────────
    const resolveCompileVote = useCallback((votes, allPlayers) => {
        const yesCount = Object.values(votes).filter(v => v === 'yes').length;
        const majority = Math.floor(allPlayers.length / 2) + 1;
        if (yesCount >= majority) {
            triggerCompile();
        } else {
            setCompileVoteOpen(false);
            addSystemMessage(`Compile vote failed — ${yesCount}/${allPlayers.length} voted yes (need ${majority}).`);
        }
    }, [triggerCompile, addSystemMessage]);

    // ── Fetch initial player list ─────────────────────────────────────────────
    useEffect(() => {
        fetch(`http://localhost:8080/api/getAllByRoom/${id}`)
            .then(res => res.json())
            .then(data => setPlayers(data.filter(u => u.username !== username).map(u => u.username)))
            .catch(err => console.error('Error fetching players:', err));
    }, [id, username]);

    // ── Briefing auto-dismiss countdown ──────────────────────────────────────
    useEffect(() => {
        if (!showBriefing) return;
        briefingTimerRef.current = setInterval(() => {
            setBriefingCountdown(c => {
                if (c <= 1) {
                    clearInterval(briefingTimerRef.current);
                    setShowBriefing(false);
                    return 0;
                }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(briefingTimerRef.current);
    }, [showBriefing]);

    // ── Game countdown ────────────────────────────────────────────────────────
    useEffect(() => {
        if (showBriefing) return;
        timerRef.current = setInterval(() => setTimeLeft(t => (t > 0 ? t - 1 : 0)), 1000);
        return () => clearInterval(timerRef.current);
    }, [showBriefing]);

    useEffect(() => {
        if (timeLeft === 0 && !gameEndedRef.current && isConnected) {
            send(`/app/room/${id}/game-over`, {}, JSON.stringify({
                sender: username, content: 'imposter_wins', type: 'GAME_OVER'
            }));
        }
    }, [timeLeft, id, username, isConnected, send]);

    // ── Compile vote timer expiry ─────────────────────────────────────────────
    useEffect(() => {
        if (!compileVoteOpen) return;
        if (compileVoteTimer <= 0) {
            clearInterval(compileVoteTimerRef.current);
            resolveCompileVote(compileVotes, [username, ...compileVotePlayersRef.current]);
        }
    }, [compileVoteTimer, compileVoteOpen, compileVotes, username, resolveCompileVote]);

    // ── WebSocket game-event subscriptions ────────────────────────────────────
    useEffect(() => {
        if (!username || !isConnected) return;

        const sub = subscribe(`/topic/room/${id}`, (message) => {
            const body = JSON.parse(message.body);

            switch (body.type) {
                case 'CHAT':
                    setMessages(prev => [...prev, {
                        user: body.sender, text: body.content,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }]);
                    break;

                case 'JOIN':
                    if (body.sender !== username) {
                        setPlayers(prev => prev.includes(body.sender) ? prev : [...prev, body.sender]);
                        addSystemMessage(`${body.sender} joined.`);
                    }
                    break;

                case 'LEAVE':
                    setPlayers(prev => prev.filter(p => p !== body.sender));
                    addSystemMessage(`${body.sender} disconnected.`);
                    break;

                case 'EMERGENCY_MEETING':
                    if (body.sender !== username) {
                        setEmergencyToast({ caller: body.sender });
                        setEmergencyOpen(true);
                        addSystemMessage(`🚨 ${body.sender} called an Emergency Meeting!`);
                        addGameAction(`${body.sender} called an Emergency Meeting`);
                        setTimeout(() => setEmergencyToast(null), 5000);
                    }
                    break;

                case 'TASK_COMPLETE':
                    if (body.sender !== username) {
                        setCrewmateDoneCount(c => c + 1);
                        addSystemMessage(`${body.sender} completed all tasks!`);
                    }
                    break;

                case 'BLACKOUT':
                    addGameAction(`${body.sender} executed Blackout`);
                    if (!isImposter) {
                        setIsBlackout(true);
                        addSystemMessage('🕶 BLACKOUT — editor blinded for 8 seconds!');
                        clearTimeout(blackoutTimerRef.current);
                        blackoutTimerRef.current = setTimeout(() => {
                            setIsBlackout(false);
                            addSystemMessage('Blackout lifted.');
                        }, 8000);
                    }
                    break;

                case 'FILE_LOCK':
                    addGameAction(`${body.sender} executed File Lock`);
                    if (!isImposter) {
                        setIsFileLocked(true);
                        addSystemMessage('🔒 FILE LOCK — editor is read-only for 12 seconds!');
                        clearTimeout(fileLockTimerRef.current);
                        fileLockTimerRef.current = setTimeout(() => {
                            setIsFileLocked(false);
                            addSystemMessage('File lock released.');
                        }, 12000);
                    }
                    break;

                case 'RESET':
                    resetAllFiles(INITIAL_CODE);
                    addGameAction(`${body.sender} executed Reset — code wiped`);
                    if (!isImposter) {
                        setTasks(INITIAL_TASKS.map(t => ({ ...t, done: false })));
                        taskCompleteSentRef.current = false;
                        addSystemMessage('💀 RESET — all code files wiped back to starter!');
                    }
                    break;

                case 'VOTE_RESULT': {
                    const ejected        = body.sender;
                    const result         = body.content;
                    const actualImposter = body.target;
                    const myOutcome      = result === 'crewmates_win'
                        ? (isImposter ? 'defeat' : 'victory')
                        : (isImposter ? 'victory' : 'defeat');
                    addSystemMessage(`${ejected} was ejected. ${result === 'crewmates_win' ? 'Crewmates win!' : 'Imposter wins!'}`);
                    setTimeout(() => endGame(myOutcome, actualImposter), 1500);
                    break;
                }

                case 'GAME_OVER': {
                    const result         = body.content;
                    const actualImposter = body.target;
                    const myOutcome      = result === 'crewmates_win'
                        ? (isImposter ? 'defeat' : 'victory')
                        : (isImposter ? 'victory' : 'defeat');
                    endGame(myOutcome, actualImposter);
                    break;
                }

                // ── Compile vote: another player initiated a vote ─────────────
                case 'COMPILE_VOTE_START':
                    if (body.sender !== username) {
                        addGameAction(`${body.sender} called a Compile Vote`);
                        setCompileVoteOpen(true);
                        setCompileVotes({});
                        setMyCompileVote(null);
                        setCompileVoteTimer(15);
                        compileVotePlayersRef.current = [...players];
                        addSystemMessage(`⚙ ${body.sender} called a Compile Vote!`);
                        clearInterval(compileVoteTimerRef.current);
                        compileVoteTimerRef.current = setInterval(() => {
                            setCompileVoteTimer(t => {
                                if (t <= 1) { clearInterval(compileVoteTimerRef.current); return 0; }
                                return t - 1;
                            });
                        }, 1000);
                    }
                    break;

                // ── Compile vote: a player cast their vote ────────────────────
                case 'COMPILE_VOTE_CAST':
                    setCompileVotes(prev => {
                        const next = { ...prev, [body.sender]: body.content };
                        const allPlayers = [username, ...compileVotePlayersRef.current];
                        if (Object.keys(next).length >= allPlayers.length) {
                            clearInterval(compileVoteTimerRef.current);
                            resolveCompileVote(next, allPlayers);
                        }
                        return next;
                    });
                    break;

                default:
                    break;
            }
        });

        const userSub = subscribe(`/queue/room/${id}/sabotage/${username}`, (message) => {
            const body = JSON.parse(message.body);
            switch (body.sabotage) {
                case 'BLACKOUT':
                    addGameAction(`${body.sender || 'Imposter'} executed Blackout (targeted)`);
                    if (!isImposter) {
                        setIsBlackout(true);
                        addSystemMessage('🕶 BLACKOUT (private)');
                        clearTimeout(blackoutTimerRef.current);
                        blackoutTimerRef.current = setTimeout(() => {
                            setIsBlackout(false);
                            addSystemMessage('Blackout lifted.');
                        }, 8000);
                    }
                    break;

                case 'FILE_LOCK':
                    addGameAction(`${body.sender || 'Imposter'} executed File Lock (targeted)`);
                    if (!isImposter) {
                        setIsFileLocked(true);
                        addSystemMessage('🔒 FILE LOCK (private)');
                        clearTimeout(fileLockTimerRef.current);
                        fileLockTimerRef.current = setTimeout(() => {
                            setIsFileLocked(false);
                            addSystemMessage('File lock released.');
                        }, 12000);
                    }
                    break;

                case 'RESET':
                    resetAllFiles(INITIAL_CODE);
                    addGameAction(`${body.sender || 'Imposter'} executed Reset (targeted)`);
                    if (!isImposter) {
                        setTasks(INITIAL_TASKS.map(t => ({ ...t, done: false })));
                        taskCompleteSentRef.current = false;
                        addSystemMessage('💀 RESET (private)');
                    }
                    break;

                default:
                    break;
            }
        });

        send(`/app/room/${id}/join`, {}, JSON.stringify({ sender: username, type: 'JOIN' }));
        return () => {
            if (sub) sub.unsubscribe();
            userSub.unsubscribe();
        };
    }, [id, username, isConnected, subscribe, send, addSystemMessage, addGameAction, endGame, isImposter, players, resolveCompileVote, resetAllFiles]);

    // Auto-scroll chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Task win condition ────────────────────────────────────────────────────
    useEffect(() => {
        if (isImposter) return;
        const allDone = tasks.every(t => t.done);
        if (allDone && !taskCompleteSentRef.current && isConnected) {
            taskCompleteSentRef.current = true;
            send(`/app/room/${id}/task`, {}, JSON.stringify({
                sender: username, type: 'TASK_COMPLETE', content: 'all_done'
            }));
        }
    }, [tasks, isImposter, isConnected, id, username, send]);

    // ── Fire the selected sabotage ────────────────────────────────────────────
    const handleSabotage = () => {
        if (!selectedSabotage || !isConnected || cooldowns[selectedSabotage.type] > 0) return;

        send(`/app/room/${id}/sabotage`, {}, JSON.stringify({
            sender: username,
            type: 'SABOTAGE',
            sabotage: selectedSabotage.type,
            content: selectedSabotage.type,
            target: chosenPlayer || null
        }));

        addGameAction(`You executed ${selectedSabotage.label}`);
        if (selectedSabotage.type === 'RESET') {
            resetAllFiles(INITIAL_CODE);
        }
        startCooldown(selectedSabotage.type, selectedSabotage.cooldown);
        setSelectedSabotage(null);
    };

    // ── Call a compile vote ───────────────────────────────────────────────────
    const handleCallCompileVote = () => {
        if (!isConnected || compileVoteOpen || compileRunning) return;
        setCompileVoteOpen(true);
        setCompileVotes({});
        setMyCompileVote(null);
        setCompileVoteTimer(15);
        compileVotePlayersRef.current = [...players];
        addSystemMessage('⚙ You called a Compile Vote!');
        clearInterval(compileVoteTimerRef.current);
        compileVoteTimerRef.current = setInterval(() => {
            setCompileVoteTimer(t => {
                if (t <= 1) { clearInterval(compileVoteTimerRef.current); return 0; }
                return t - 1;
            });
        }, 1000);
        send(`/app/room/${id}/compile-vote-start`, {}, JSON.stringify({
            sender: username, type: 'COMPILE_VOTE_START', content: 'start'
        }));
    };

    // ── Cast own compile vote ─────────────────────────────────────────────────
    const handleCastCompileVote = (choice) => {
        if (myCompileVote || !isConnected) return;
        setMyCompileVote(choice);
        send(`/app/room/${id}/compile-vote`, {}, JSON.stringify({
            sender: username, type: 'COMPILE_VOTE_CAST', content: choice
        }));
        // Optimistically record own vote
        setCompileVotes(prev => {
            const next = { ...prev, [username]: choice };
            const allPlayers = [username, ...compileVotePlayersRef.current];
            if (Object.keys(next).length >= allPlayers.length) {
                clearInterval(compileVoteTimerRef.current);
                resolveCompileVote(next, allPlayers);
            }
            return next;
        });
    };

    // ── Chat ──────────────────────────────────────────────────────────────────
    const handleSendMessage = (e) => {
        e?.preventDefault();
        if (!chatInput.trim() || !isConnected) return;
        send(`/app/room/${id}/chat`, {}, JSON.stringify({
            sender: username, content: chatInput, type: 'CHAT'
        }));
        setChatInput('');
    };

    // ── Vote ──────────────────────────────────────────────────────────────────
    const handleVoteSubmit = () => {
        if (!voteTarget || voted || !isConnected) return;
        send(`/app/room/${id}/vote`, {}, JSON.stringify({
            sender: username, content: voteTarget, type: 'VOTE'
        }));
        setVoted(true);
        setEmergencyOpen(false);
        addSystemMessage(`You voted to eject ${voteTarget}. Waiting for others…`);
    };

    const handleOpenEmergency = () => {
        if (voted) return;
        setEmergencyOpen(true);
        if (isConnected) {
            send(`/app/room/${id}/emergency`, {}, JSON.stringify({
                sender: username, type: 'EMERGENCY_MEETING', content: 'called'
            }));
        }
    };

    const windows = [
        { id: 'neural_hash',  title: 'neural_hash.py',  key: 'neural_hash'  },
        { id: 'data_sort',    title: 'data_sort.py',    key: 'data_sort'    },
        { id: 'auth_check',   title: 'auth_check.py',   key: 'auth_check'   },
        { id: 'key_rotation', title: 'key_rotation.py', key: 'key_rotation' },
        { id: 'grid_scan',    title: 'grid_scan.py',    key: 'grid_scan'    },
    ];

    const tasksDone      = tasks.filter(t => t.done).length;
    const isTimeCritical = timeLeft <= 30;

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="flex h-screen w-full flex-col overflow-hidden bg-black/30">
            {/* ── Header ── */}
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                        <span className="text-xs font-bold text-cyan-400">{id}</span>
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="truncate text-sm font-medium uppercase tracking-widest text-white">{username}</h1>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter ${
                                isImposter ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : isCompiler ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}>
                                {role}
                            </span>
                        </div>
                        <p className="text-[10px] uppercase tracking-widest text-white/45">Encrypted</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-light uppercase tracking-widest text-white/35">Time</span>
                        <span className={`font-mono text-lg font-medium tabular-nums transition-colors ${isTimeCritical ? 'text-red-500 animate-pulse' : 'text-red-400/90'}`}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                    {/* Compile Vote button */}
                    <Button
                        type="button"
                        disabled={compileVoteOpen || compileRunning}
                        className="min-w-0 px-4 py-1.5 text-xs border-cyan-500/40 text-cyan-300/90 hover:bg-cyan-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        onClick={handleCallCompileVote}
                    >
                        ⚙ Compile
                    </Button>
                    <Button
                        type="button"
                        disabled={voted}
                        className="min-w-0 px-4 py-1.5 text-xs border-red-500/40 text-red-300/90 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        onClick={handleOpenEmergency}
                    >
                        {voted ? 'Voted' : 'Emergency'}
                    </Button>
                    <Button
                        className="min-w-0 px-4 py-1.5 text-xs border-white/10 text-white/40 hover:text-white/80"
                        onClick={() => send(`/app/room/${id}/game-over`, {}, JSON.stringify({
                            sender: username, content: 'imposter_wins', type: 'GAME_OVER'
                        }))}
                    >
                        Abandon
                    </Button>
                </div>
            </header>

            <div className="flex min-h-0 flex-1 overflow-hidden">
                {/* ── Chat sidebar ── */}
                <aside className="flex w-72 shrink-0 flex-col border-r border-white/10 bg-black/20 relative z-[60]">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, idx) => (
                            <ChatMessage key={idx} user={msg.user} text={msg.text} time={msg.time} />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="shrink-0 border-t border-white/10 p-4 bg-black/30">
                        <form onSubmit={handleSendMessage} className="relative">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Transmit…"
                                className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-3 pr-10 text-xs font-light text-white placeholder:text-white/30 outline-none focus:border-cyan-500/30"
                            />
                            <button type="submit" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cyan-400/60 hover:text-cyan-400">
                                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                            </button>
                        </form>
                    </div>
                </aside>

                {/* ── Main workspace ── */}
                <main className="flex-1 flex flex-col overflow-hidden bg-[#080808]/60">
                    {!isCompiler ? (
                        <>
                            <div className="flex items-center gap-1 border-b border-white/10 bg-black/40 px-4 py-2 overflow-x-auto">
                                {windows.map((w) => (
                                    <button
                                        key={w.id}
                                        onClick={() => setActiveWindow(w.id)}
                                        className={`rounded-md px-3 py-1.5 text-[10px] font-medium uppercase tracking-widest transition-all shrink-0 ${
                                            activeWindow === w.id
                                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                                : 'text-white/40 hover:text-white/60 hover:bg-white/5 border border-transparent'
                                        }`}
                                    >
                                        {w.title}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setActiveWindow('live')}
                                    className={`rounded-md px-3 py-1.5 text-[10px] font-medium uppercase tracking-widest transition-all shrink-0 ${
                                        activeWindow === 'live'
                                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                            : 'text-white/40 hover:text-white/60 hover:bg-white/5 border border-transparent'
                                    }`}
                                >
                                    👁 Live
                                </button>
                            </div>
                            <div className="flex-1 p-6 overflow-hidden flex flex-col gap-4">
                                {activeWindow === 'live' ? (
                                    <div className="flex-1 flex flex-col overflow-hidden rounded-xl border border-white/10 shadow-2xl">
                                        <div className="flex items-center gap-2 border-b border-white/10 bg-black/40 px-4 py-2 shrink-0 flex-wrap">
                                            <span className="text-[9px] uppercase tracking-widest text-purple-400/60 mr-1">Watch:</span>
                                            {players.length === 0 ? (
                                                <span className="text-[10px] text-white/20">No other players yet</span>
                                            ) : players.map(p => (
                                                <button key={p} onClick={() => setWatchingPlayer(p)}
                                                    className={`px-3 py-1 rounded-md text-[10px] border transition-all shrink-0 ${
                                                        watchingPlayer === p
                                                            ? 'border-purple-500/50 bg-purple-500/10 text-purple-300'
                                                            : 'border-white/10 text-white/40 hover:bg-white/5'
                                                    }`}>{p}</button>
                                            ))}
                                            <div className="ml-auto flex gap-1">
                                                {windows.map(w => (
                                                    <button key={w.id} onClick={() => setLiveActiveFile(w.key)}
                                                        className={`px-2 py-1 rounded text-[9px] border transition-all shrink-0 ${
                                                            liveActiveFile === w.key
                                                                ? 'border-purple-500/30 bg-purple-500/10 text-purple-300'
                                                                : 'border-white/5 text-white/30 hover:text-white/50'
                                                        }`}>{w.title}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex-1 relative overflow-hidden">
                                            {watchingPlayer ? (
                                                <YjsCodeEditor
                                                    ytext={getYText(liveActiveFile)}
                                                    ydoc={ydoc}
                                                    awareness={awareness}
                                                    fileKey={liveActiveFile}
                                                    username={username}
                                                    title={`${watchingPlayer} — ${windows.find(w => w.key === liveActiveFile)?.title}`}
                                                    language="Python"
                                                    lineCount={30}
                                                    readOnly
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-white/20 text-xs uppercase tracking-widest">
                                                    Select a player above to watch their code
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 relative overflow-hidden rounded-xl border border-white/10 shadow-2xl">
                                        {/* BLACKOUT overlay */}
                                        {isBlackout && (
                                            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/95 rounded-xl select-none">
                                                <p className="text-5xl mb-3 animate-pulse">🕶</p>
                                                <p className="text-xs uppercase tracking-[0.3em] text-orange-400/80">Blackout Active</p>
                                                <p className="text-[10px] text-white/25 font-mono mt-1">Editor blinded by hostile agent</p>
                                            </div>
                                        )}
                                        {/* FILE LOCK banner */}
                                        {isFileLocked && (
                                            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-lg border border-purple-500/40 bg-black/90 px-4 py-2 shadow-xl pointer-events-none">
                                                <span className="text-sm">🔒</span>
                                                <span className="text-[10px] uppercase tracking-widest text-purple-300">File locked — read only</span>
                                            </div>
                                        )}
                                        {windows.map((w) => (
                                            <div
                                                key={w.id}
                                                className={`absolute inset-0 transition-all duration-500 ease-in-out transform ${
                                                    activeWindow === w.id
                                                        ? 'translate-x-0 opacity-100 scale-100'
                                                        : 'translate-x-8 opacity-0 scale-[0.98] pointer-events-none'
                                                }`}
                                            >
                                                <YjsCodeEditor
                                                    ytext={getYText(w.key)}
                                                    ydoc={ydoc}
                                                    awareness={awareness}
                                                    fileKey={w.key}
                                                    username={username}
                                                    title={w.title}
                                                    language="Python"
                                                    lineCount={30}
                                                    readOnly={isFileLocked}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <CompilerView />
                    )}
                </main>

                {/* ── Tasks / imposter sidebar ── */}
                <aside className="flex w-64 shrink-0 flex-col border-l border-white/10 bg-black/20">
                    <LiveActivityPanel
                        awareness={awareness}
                        localClientId={localAwarenessClientId}
                        gameActions={gameActions}
                    />
                    <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center justify-between">
                        <h2 className="text-[10px] font-light uppercase tracking-widest text-white/50">
                            {isImposter ? 'Sabotage' : 'Tasks'}
                        </h2>
                        {!isImposter && (
                            <span className="text-[10px] tabular-nums text-white/30">{tasksDone}/{tasks.length}</span>
                        )}
                    </div>

                    {isImposter ? (
                        /* ── Imposter sabotage panel ── */
                        <div className="flex flex-col gap-3 p-4 flex-1">
                            <p className="text-[9px] uppercase tracking-widest text-red-400/50 leading-relaxed">
                                Select a sabotage type and execute.
                            </p>

                            <div className="space-y-2">
                                {SABOTAGE_TYPES.map(s => {
                                    const cd = cooldowns[s.type];
                                    const onCooldown = cd > 0;
                                    const isSelected = selectedSabotage?.type === s.type;
                                    return (
                                        <button
                                            key={s.type}
                                            type="button"
                                            disabled={onCooldown}
                                            onClick={() => setSelectedSabotage(isSelected ? null : s)}
                                            className={`relative w-full rounded-xl border px-4 py-3 text-left transition-all overflow-hidden ${
                                                onCooldown
                                                    ? 'border-white/5 bg-white/[0.02] cursor-not-allowed'
                                                    : isSelected
                                                        ? 'border-red-500/50 bg-red-500/10 cursor-pointer'
                                                        : 'border-white/10 bg-white/[0.03] hover:border-red-500/30 cursor-pointer'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={onCooldown ? 'opacity-30' : ''}>{s.icon}</span>
                                                    <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                                                        onCooldown ? 'text-white/20' : isSelected ? 'text-red-300' : 'text-white/70'
                                                    }`}>
                                                        {s.label}
                                                    </span>
                                                </div>
                                                {onCooldown && (
                                                    <span className="text-[9px] font-mono text-white/25 border border-white/10 rounded px-1.5 py-0.5">
                                                        {cd}s
                                                    </span>
                                                )}
                                                {!onCooldown && isSelected && (
                                                    <span className="text-[8px] font-bold uppercase text-red-400 border border-red-500/30 rounded px-1.5 py-0.5 bg-red-500/10">
                                                        Selected
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-[9px] font-light leading-relaxed ${onCooldown ? 'text-white/15' : 'text-white/40'}`}>
                                                {s.description}
                                            </p>
                                            {onCooldown && (
                                                <div className="absolute bottom-0 left-0 h-0.5 w-full bg-white/5">
                                                    <div
                                                        className="h-full bg-red-500/40 transition-all duration-1000"
                                                        style={{ width: `${((s.cooldown - cd) / s.cooldown) * 100}%` }}
                                                    />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-widest text-white/30">Target Player</label>
                                <select
                                    className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70 outline-none focus:border-red-500/30"
                                    value={chosenPlayer}
                                    onChange={(e) => setChosenPlayer(e.target.value)}
                                >
                                    <option className="bg-black text-white cursor-pointer" value="">— All players —</option>
                                    {players
                                        .filter(p => p !== username)
                                        .map(p => (
                                            <option className="bg-black text-white cursor-pointer" key={p} value={p}>
                                                {p}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <button
                                type="button"
                                disabled={!selectedSabotage || cooldowns[selectedSabotage?.type] > 0}
                                onClick={handleSabotage}
                                className={`w-full rounded-lg border py-3 text-xs font-medium uppercase tracking-widest transition-all ${
                                    selectedSabotage && cooldowns[selectedSabotage.type] === 0
                                        ? 'border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 cursor-pointer'
                                        : 'border-white/5 bg-white/[0.02] text-white/20 cursor-not-allowed'
                                }`}
                            >
                                {selectedSabotage ? `⚡ Execute ${selectedSabotage.label}` : 'Select an ability'}
                            </button>

                            <div className="mt-auto border-t border-white/10 pt-4 space-y-1">
                                <p className="text-[9px] uppercase tracking-widest text-white/25 mb-2">Players online</p>
                                {[username, ...players].map(p => (
                                    <div key={p} className="text-[10px] text-white/50 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 inline-block" />
                                        {p}{p === username ? ' (you)' : ''}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* ── Crewmate task checklist ── */
                        <>
                            <ul className="flex-1 overflow-y-auto p-3 space-y-2">
                                {tasks.map((task) => (
                                    <li key={task.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
                                        <button
                                            type="button"
                                            onClick={() => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t))}
                                            className="h-4 w-4 shrink-0 rounded border border-white/20 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                        >
                                            {task.done && <span className="text-cyan-400 text-xs">✓</span>}
                                        </button>
                                        <span className={`text-xs font-light ${task.done ? 'text-white/40 line-through' : 'text-white/80'}`}>
                                            {task.label}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            {crewmateDoneCount > 0 && (
                                <div className="shrink-0 border-t border-white/10 px-4 py-2">
                                    <p className="text-[10px] text-emerald-400/70 uppercase tracking-widest">
                                        {crewmateDoneCount} crewmate{crewmateDoneCount !== 1 ? 's' : ''} finished
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </aside>
            </div>

            {/* ── Pre-game briefing overlay ── */}
            {showBriefing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
                    <div className="max-w-lg w-full mx-4 rounded-2xl border border-cyan-500/20 bg-black/80 p-8 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[10px] uppercase tracking-[0.3em] text-red-400/80">Incident #7743 — Active</span>
                        </div>
                        <h2 className="text-2xl font-light uppercase tracking-[0.2em] text-cyan-400 mb-2">Mission Briefing</h2>
                        <p className="text-[10px] uppercase tracking-widest text-white/30 mb-6">Nexus Core — Emergency Protocol</p>
                        <div className="space-y-3 text-sm font-light text-white/70 leading-relaxed mb-8">
                            <p>The primary <span className="text-cyan-400/90">Python neural modules</span> have been corrupted by an unknown intrusion vector.</p>
                            <p>Your team must repair <span className="text-cyan-400/90">5 critical algorithms</span> before the 3-minute lockdown expires. Each agent works on their own isolated copy.</p>
                            <ul className="list-disc list-inside space-y-1 text-white/45 text-xs font-mono">
                                <li>neural_hash.py — implement secure_hash()</li>
                                <li>data_sort.py — fix quicksort duplicate bug</li>
                                <li>auth_check.py — implement token_verify()</li>
                                <li>key_rotation.py — fix rotation direction</li>
                                <li>grid_scan.py — implement pattern_match()</li>
                            </ul>
                            <p className="text-red-400/80 border border-red-500/20 rounded-lg p-3 bg-red-500/5 text-xs">
                                ⚠ WARNING: One agent among you is a hostile operative actively sabotaging the repair process. Trust no one.
                            </p>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-widest text-white/25">Auto-start in {briefingCountdown}s</span>
                            <Button primary onClick={() => setShowBriefing(false)} className="px-6 text-xs tracking-widest uppercase">
                                Begin Mission
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Emergency meeting toast ── */}
            {emergencyToast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 rounded-xl border border-red-500/40 bg-black/90 px-5 py-3 shadow-2xl animate-bounce">
                    <span className="text-base">🚨</span>
                    <div>
                        <p className="text-xs font-semibold text-red-400 uppercase tracking-widest">{emergencyToast.caller} called an Emergency Meeting!</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">Vote modal opened</p>
                    </div>
                </div>
            )}

            {/* ── Emergency vote modal ── */}
            {emergencyOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={() => setEmergencyOpen(false)}
                >
                    <div
                        className="w-full max-w-2xl rounded-2xl border border-red-500/20 bg-black/90 p-6 shadow-2xl flex gap-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex-1 flex flex-col min-w-0">
                            <h3 className="text-lg font-medium uppercase tracking-widest text-red-400/90 mb-1">Emergency Meeting</h3>
                            <p className="text-[10px] font-light uppercase tracking-widest text-white/40 mb-4">Vote to eject a player</p>
                            <ul className="space-y-2 mb-6 flex-1">
                                {players.length === 0 ? (
                                    <p className="text-xs text-white/30 text-center py-4">No other players detected.</p>
                                ) : players.map((name) => (
                                    <li key={name}>
                                        <button
                                            type="button"
                                            onClick={() => setVoteTarget(name)}
                                            className={`w-full rounded-lg border px-4 py-2.5 text-left text-sm font-light transition-colors ${
                                                voteTarget === name
                                                    ? 'border-red-500/50 bg-red-500/10 text-red-200'
                                                    : 'border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08]'
                                            }`}
                                        >
                                            {name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <div className="flex gap-3">
                                <Button className="flex-1" onClick={() => setEmergencyOpen(false)}>Cancel</Button>
                                <Button
                                    primary
                                    disabled={!voteTarget}
                                    className="flex-1 border-red-500/40 text-red-200 hover:bg-red-500/20 disabled:opacity-30"
                                    onClick={handleVoteSubmit}
                                >
                                    Eject
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Compile Vote modal ── */}
            {compileVoteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-cyan-500/20 bg-black/90 p-6 shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-lg font-medium uppercase tracking-widest text-cyan-400/90">Compile Vote</h3>
                            <div className="flex items-center gap-2">
                                <span className={`font-mono text-xs border rounded px-2 py-0.5 tabular-nums ${
                                    compileVoteTimer <= 5 ? 'text-red-400 border-red-500/30 animate-pulse' : 'text-white/30 border-white/10'
                                }`}>
                                    {compileVoteTimer}s
                                </span>
                            </div>
                        </div>
                        <p className="text-[10px] font-light uppercase tracking-widest text-white/40 mb-1">
                            Majority yes triggers a full build
                        </p>
                        <p className="text-[10px] text-white/25 mb-5">
                            Errors and accuracy scores will be revealed to all players.
                        </p>

                        {/* Vote timer bar */}
                        <div className="w-full h-0.5 bg-white/5 rounded-full overflow-hidden mb-5">
                            <div
                                className="h-full bg-cyan-500/50 transition-all duration-1000"
                                style={{ width: `${(compileVoteTimer / 15) * 100}%` }}
                            />
                        </div>

                        {/* Vote buttons */}
                        {!myCompileVote ? (
                            <div className="flex gap-3 mb-5">
                                <button
                                    onClick={() => handleCastCompileVote('yes')}
                                    className="flex-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 py-3 text-xs font-medium uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                                >
                                    ✓ &nbsp;Compile
                                </button>
                                <button
                                    onClick={() => handleCastCompileVote('no')}
                                    className="flex-1 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300/80 py-3 text-xs font-medium uppercase tracking-widest hover:bg-red-500/20 transition-all"
                                >
                                    ✕ &nbsp;Skip
                                </button>
                            </div>
                        ) : (
                            <div className="mb-5 rounded-lg border border-white/10 bg-white/[0.02] py-3 text-center text-xs uppercase tracking-widest text-white/40">
                                Vote cast ({myCompileVote === 'yes'
                                    ? <span className="text-emerald-400">compile</span>
                                    : <span className="text-red-400/70">skip</span>}) — waiting for others…
                            </div>
                        )}

                        {/* Player vote status */}
                        <div className="space-y-2">
                            <p className="text-[9px] uppercase tracking-widest text-white/25 mb-2">Player votes</p>
                            {[username, ...compileVotePlayersRef.current].map(p => (
                                <div key={p} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 inline-block" />
                                        <span className="text-xs text-white/60">{p}{p === username ? ' (you)' : ''}</span>
                                    </div>
                                    <span className={`text-[10px] uppercase tracking-widest font-medium ${
                                        compileVotes[p] === 'yes' ? 'text-emerald-400'
                                        : compileVotes[p] === 'no'  ? 'text-red-400/70'
                                        : 'text-white/20'
                                    }`}>
                                        {compileVotes[p] === 'yes' ? '✓ compile'
                                         : compileVotes[p] === 'no' ? '✕ skip'
                                         : '…'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Running tally */}
                        <div className="mt-4 flex items-center justify-between text-[10px] text-white/30 border-t border-white/5 pt-3">
                            <span>Yes: <span className="text-emerald-400/70 font-mono">{Object.values(compileVotes).filter(v => v === 'yes').length}</span></span>
                            <span>No: <span className="text-red-400/70 font-mono">{Object.values(compileVotes).filter(v => v === 'no').length}</span></span>
                            <span>Pending: <span className="text-white/40 font-mono">{[username, ...compileVotePlayersRef.current].length - Object.keys(compileVotes).length}</span></span>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Compile running overlay ── */}
            {compileRunning && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl border border-cyan-500/20 bg-black/90 p-8 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                            <h3 className="text-sm font-light uppercase tracking-[0.2em] text-cyan-400">Compiling...</h3>
                        </div>
                        <div className="space-y-2 font-mono">
                            {compileLogs.map((log, i) => (
                                <div key={i} className={`text-[11px] transition-all ${
                                    log.includes('[OK]') ? 'text-emerald-400/80' : 'text-white/35'
                                }`}>
                                    {log}
                                </div>
                            ))}
                            {compileLogs.length < TASK_KEYS.length + 1 && (
                                <div className="text-[11px] text-cyan-400/40 animate-pulse">_</div>
                            )}
                        </div>
                        {/* Progress bar */}
                        <div className="mt-6 w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-cyan-500/60 transition-all duration-300"
                                style={{
                                    width: `${Math.min(
                                        (compileLogs.length / (TASK_KEYS.length + 1)) * 100,
                                        100
                                    )}%`
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ── Compile Results modal ── */}
            {showCompileResults && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowCompileResults(false)}
                >
                    <div
                        className="w-full max-w-2xl rounded-2xl border border-white/10 bg-black/95 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-medium uppercase tracking-widest text-cyan-400/90">Build Report</h3>
                                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border bg-white/5 text-white/50 border-white/10">
                                    Build Summary
                                </span>
                            </div>
                            <button
                                onClick={() => setShowCompileResults(false)}
                                className="text-white/30 hover:text-white/60 text-xs uppercase tracking-widest transition-colors px-2 py-1"
                            >
                                ✕ Close
                            </button>
                        </div>
                        <p className="text-[10px] uppercase tracking-widest text-white/30 mb-5">
                            Runtime compilation results across all modules
                        </p>

                        {/* File rows */}
                        <div className="space-y-2 mb-5">
                            {TASK_KEYS.map(taskId => {
                                const verdict = compileResults[taskId] || 'PENDING';
                                const isAccepted = verdict === 'ACCEPTED';
                                const isTimeout = verdict === 'TIME_LIMIT_EXCEEDED';
                                const statusLabel = isAccepted ? 'ACCEPTED'
                                    : isTimeout ? 'TIMEOUT'
                                        : verdict === 'WRONG_ANSWER' ? 'WRONG'
                                            : verdict === 'RUNTIME_ERROR' ? 'ERROR'
                                                : 'PENDING';
                                const statusClass = isAccepted
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : 'bg-red-500/10 text-red-400 border-red-500/30';

                                return (
                                    <div
                                        key={taskId}
                                        className="grid grid-cols-[1fr_100px] gap-3 items-center rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3"
                                    >
                                        <p className="text-xs text-white/70 font-mono">{taskId}.py</p>
                                        <div className="flex justify-center">
                                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${statusClass}`}>
                                                {statusLabel}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Summary stats */}
                        {(() => {
                            const passing = Object.values(compileResults).filter(v => v === 'ACCEPTED').length;
                            const errors = Object.values(compileResults).filter(v => v === 'RUNTIME_ERROR').length;
                            const wrong = Object.values(compileResults).filter(v => v === 'WRONG_ANSWER').length;
                            const timeouts = Object.values(compileResults).filter(v => v === 'TIME_LIMIT_EXCEEDED').length;
                            return (
                                <div className="grid grid-cols-4 gap-3 border-t border-white/5 pt-4">
                                    {[
                                        { label: 'Passed', val: passing, color: 'text-emerald-400' },
                                        { label: 'Wrong', val: wrong, color: 'text-amber-400' },
                                        { label: 'Errors', val: errors, color: 'text-red-400' },
                                        { label: 'Timeouts', val: timeouts, color: 'text-orange-400' },
                                    ].map(s => (
                                        <div key={s.label} className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-center">
                                            <p className={`text-xl font-mono font-medium ${s.color}`}>{s.val}</p>
                                            <p className="text-[9px] text-white/25 uppercase tracking-widest mt-1">{s.label}</p>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}

                        <p className="mt-4 text-center text-[10px] text-white/20 uppercase tracking-widest">
                            Click anywhere outside to close
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function RoomPage(props) {
    const { id } = useParams();
    return (
        <YjsRoomProvider roomId={id} username={props.username} initialCode={INITIAL_CODE}>
            <RoomPageContent {...props} />
        </YjsRoomProvider>
    );
}