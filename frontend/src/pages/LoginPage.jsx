import React from 'react';
import { GlassCard, Input, Button } from '../components/ui/platform-components';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        navigate('/lobby');
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-6">
            <GlassCard className="w-full max-w-sm p-8 sm:p-10">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-2 text-center">
                        <h1 className="text-3xl font-extralight tracking-tight text-white sm:text-4xl">
                            Identify Yourself
                        </h1>
                        <p className="text-sm font-light text-white/40">
                            Enter your credentials to access the neural net.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="flex flex-col gap-6">
                        <div className="flex flex-col gap-4">
                            <Input label="Neural ID" placeholder="user@nexus.com" type="email" required />
                            <Input label="Access Key" placeholder="••••••••" type="password" required />
                        </div>

                        <Button primary type="submit" className="mt-2">
                            Authorize Access
                        </Button>
                    </form>

                    <div className="text-center">
                        <button className="text-[10px] font-light uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors">
                            Request Emergency Uplink
                        </button>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
