import React, { useState, useEffect } from 'react';

import { useNavigate, useParams, useLocation } from 'react-router-dom';

const ROLE_CONFIG = {
    imposter: {
        label: 'Imposter',
        subtitle: 'Corrupt the network',
        description: 'Blend in. Sabotage systems. Eliminate crewmates before they complete the objective.',
        accent: 'red',
        badge: 'HOSTILE',
    },
    crewmate: {
        label: 'Crewmate',
        subtitle: 'Fix the app',
        description: 'Complete tasks and identify the imposter before they take down the network.',
        accent: 'emerald',
        badge: 'ALLY',
    },
    compiler: {
        label: 'Compiler',
        subtitle: 'Determine code quality',
        description: 'Review code submissions, execute builds, and ensure system integrity.',
        accent: 'cyan',
        badge: 'ENGINEER',
    },
};

function getRoleConfig(role) {
    const key = (role || '').toLowerCase();
    return ROLE_CONFIG[key] || {
        label: role || 'Unknown',
        subtitle: 'Role assigned',
        description: 'Your role has been assigned. Proceed to the lobby when ready.',
        accent: 'cyan',
        badge: 'ASSIGNED',
    };
}

export default function RolePage(props) {
    const { role: roleParam } = useParams();
    const location = useLocation();
    const roleSlug = roleParam || props.role || 'crewmate';
    const roomId = location.state?.roomId || 'nexus-core';
    const config = getRoleConfig(roleSlug);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleNavigate = (path) => {
        setIsLoading(true);
        setTimeout(() => navigate(path), 1200);
    };

    const accentColor = config.accent || 'cyan';
    const isImposter = roleSlug.toLowerCase() === 'imposter';

    const accentBorder = `border-${accentColor}-500/30`;
    const accentText = `text-${accentColor}-400`;
    const accentBg = `bg-${accentColor}-500/10`;
    const animation = isImposter ? 'animate-pulse' : 'animate-bounce';
    useEffect(() => {
        setTimeout(() => {
            navigate(`/room/${roomId}`, { state: { role: roleSlug, roomId } });
        }, 4000);
    }, [navigate, roleSlug, roomId]);
    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-8">
            <div
                className={`w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-xl transition-opacity duration-500 sm:p-10 ${accentBorder} ${isLoading ? 'opacity-50' : 'opacity-100'}`}
            >
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-4 text-center">
                        <span
                            className={`inline-flex w-fit mx-auto items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-widest ${accentBg} ${accentText} border-current/30`}
                        >
                            {config.badge}
                        </span>
                        <h1 className={`text-3xl font-extralight tracking-tight text-white sm:text-4xl md:text-5xl ${animation}`}>
                            {config.label}
                        </h1>
                        <p className="text-sm font-light text-white/50 uppercase tracking-widest">
                            {config.subtitle}
                        </p>
                        <p className="text-sm font-light leading-relaxed text-white/45 max-w-sm mx-auto">
                            {config.description}
                        </p>
                    </div>



                    <div className="flex items-center justify-between border-t border-white/10 pt-5 text-[10px] font-light uppercase tracking-widest text-white/35">
                        <span>Role locked</span>
                        <span className="tabular-nums">Session active</span>
                    </div>
                </div>
            </div>


        </div>
    );
}
