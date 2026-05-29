import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/platform-components';

export default function ProfilePage({ username }) {
    const navigate = useNavigate();

    const stats = [
        { label: 'Total Matches', value: '142' },
        { label: 'Win Rate', value: '68%' },
        { label: 'Imposter Frequency', value: '24%' },
        { label: 'Code Poster Rank', value: 'Diamond' },
    ];

    const matchHistory = [
        { id: 1, role: 'Crewmate', result: 'Victory', accuracy: '95%', date: '2 hours ago' },
        { id: 2, role: 'Imposter', result: 'Defeat', accuracy: 'N/A', date: '5 hours ago' },
        { id: 3, role: 'Crewmate', result: 'Victory', accuracy: '100%', date: 'Yesterday' },
        { id: 4, role: 'Crewmate', result: 'Defeat', accuracy: '82%', date: 'Yesterday' },
        { id: 5, role: 'Imposter', result: 'Victory', accuracy: '100%', date: '2 days ago' },
    ];

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-8 animate-in fade-in duration-500">
            <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-xl sm:p-10 backdrop-blur-md">
                <div className="flex flex-col gap-10">
                    
                    {/* Header Section */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-6">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl font-extralight tracking-tight text-white sm:text-4xl">
                                Agent Profile
                            </h1>
                            <p className="text-sm font-light leading-relaxed text-cyan-400">
                                {username || 'Anonymous_User'}
                            </p>
                        </div>
                        <Button onClick={() => navigate('/lobby')}>
                            Back to Lobby
                        </Button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {stats.map((stat, i) => (
                            <div key={i} className="flex flex-col items-center justify-center rounded-xl bg-white/[0.02] border border-white/5 p-6 hover:bg-white/[0.04] transition-colors duration-300">
                                <span className="text-xs uppercase tracking-widest text-white/40 mb-2 text-center">{stat.label}</span>
                                <span className="text-2xl font-light text-white">{stat.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Match History */}
                    <div className="flex flex-col gap-4">
                        <h2 className="text-xl font-extralight tracking-tight text-white mb-2">
                            Recent Deployments
                        </h2>
                        <div className="rounded-xl border border-white/5 bg-black/20 overflow-hidden">
                            <table className="w-full text-left text-sm text-white/70">
                                <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-white/40 border-b border-white/5">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Role</th>
                                        <th className="px-6 py-4 font-medium">Result</th>
                                        <th className="px-6 py-4 font-medium">Accuracy</th>
                                        <th className="px-6 py-4 font-medium text-right">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {matchHistory.map((match) => (
                                        <tr key={match.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${match.role === 'Imposter' ? 'bg-red-500/10 text-red-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                                                    {match.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={match.result === 'Victory' ? 'text-green-400' : 'text-red-400'}>
                                                    {match.result}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-cyan-400 font-mono">
                                                {match.accuracy}
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap text-white/40">
                                                {match.date}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
