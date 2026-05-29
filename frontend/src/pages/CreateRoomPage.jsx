import React, { useState, useEffect } from 'react';
import { Input, Button } from '../components/ui/platform-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

export default function CreateRoomPage({ username = 'You', isConnected: propsIsConnected = false }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { send, subscribe, isConnected: socketIsConnected } = useSocket();
    const isConnected = propsIsConnected || socketIsConnected;
    
    const [roomName, setRoomName] = useState(location.state?.roomKey || '');
    const [maxPlayers, setMaxPlayers] = useState('4');
    const [difficulty, setDifficulty] = useState('Normal');
    const [isLoading, setIsLoading] = useState(false);
    const [language, setLanguage] = useState('Python');
    const handleCreateRoom = (e) => {
        e.preventDefault();
        setIsLoading(true);

        const newRoomId = roomName || Math.random().toString(36).substring(2, 10);

        if (!isConnected) {
            alert('Not connected. Please connect from the lobby first.');
            navigate('/lobby');
            return;
        }

       const timeout = setTimeout(() => {
    subscription.unsubscribe();
    navigate(`/waiting/${newRoomId}`);
}, 3000);

const subscription = subscribe(`/queue/errors/${username}`, (msg) => {
    console.log('Received message on error queue:', msg.body);

    clearTimeout(timeout); // IMPORTANT

    const body = msg.body;

    if (body) {
        alert(body);
        setIsLoading(false);

        subscription.unsubscribe();
        navigate('/lobby');
    }
});
        const payload = {
            sender: username,
            type: 'CREATE',
            roomId: newRoomId,
            content: JSON.stringify({ maxPlayers, difficulty })
        };

        // Send STOMP message
        send(`/app/createRoom/${newRoomId}`, {}, JSON.stringify(payload));
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-8">
            <div className={`w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-xl sm:p-10 transition-opacity duration-500 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-2 text-center">
                        <h1 className="text-3xl font-extralight tracking-tight text-white sm:text-4xl">
                            Configure Room
                        </h1>
                        <p className="text-sm font-light leading-relaxed text-white/45 max-w-[280px] mx-auto">
                            Setup your game parameters before establishing the uplink.
                        </p>
                    </div>

                    <form onSubmit={handleCreateRoom} className="flex flex-col gap-6">
                        <Input 
                            label="Custom Room ID (Optional)" 
                            placeholder="my-awesome-room" 
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                        />
                        
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#38bdf8]">Max Players</label>
                            <select 
                                className="w-full rounded-md border border-white/10 bg-transparent px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all focus:border-[#38bdf8] focus:bg-white/5"
                                value={maxPlayers}
                                onChange={(e) => setMaxPlayers(e.target.value)}
                            >
                                <option value="2" className="bg-gray-900">2 Players</option>
                                <option value="4" className="bg-gray-900">4 Players</option>
                                <option value="6" className="bg-gray-900">6 Players</option>
                                <option value="8" className="bg-gray-900">8 Players</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#38bdf8]">Difficulty</label>
                            <select 
                                className="w-full rounded-md border border-white/10 bg-transparent px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all focus:border-[#38bdf8] focus:bg-white/5"
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                            >
                                <option value="Easy" className="bg-gray-900">Easy</option>
                                <option value="Normal" className="bg-gray-900">Normal</option>
                                <option value="Hard" className="bg-gray-900">Hard</option>
                            </select>
                        </div>
                         <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#38bdf8]">Language</label>
                            <select 
                                className="w-full rounded-md border border-white/10 bg-transparent px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all focus:border-[#38bdf8] focus:bg-white/5"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                            >
                                <option value="Python" className="bg-gray-900">Python</option>
                                <option value="JavaScript" className="bg-gray-900">JavaScript</option>
                                <option value="Java" className="bg-gray-900">Java</option>
                            </select>
                        </div>

                        <Button primary type="submit" disabled={isLoading}>
                            {isLoading ? 'Creating Room...' : 'Create & Join'}
                        </Button>
                        <Button type="button" onClick={() => navigate('/lobby')} disabled={isLoading}>
                            Cancel
                        </Button>
                    </form>
                </div>
            </div>
            {isLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-500 opacity-100">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="h-12 w-12 border-4 border-red-700 border-t-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-0 h-12 w-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
                        </div>
                        <p className="text-cyan-300 font-mono text-sm uppercase tracking-widest animate-pulse">
                            Constructing Room...
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
