import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from './services/authService';
import { Sparkles, AlertCircle, Loader2 } from 'lucide-react';

export const MagicLinkPage: React.FC<{ onLoginSuccess: (token: string, email: string) => void }> = ({ onLoginSuccess }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Authenticating via magic link...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid magic link. Missing token.');
            return;
        }

        const magicLogin = async () => {
            try {
                const data = await authService.magicLogin(token);
                setStatus('success');
                setMessage('Login successful!');
                onLoginSuccess(data.access_token, data.email);
                setTimeout(() => {
                    navigate('/');
                    // Small hack to ensure App.tsx sees we are logged in if state doesn't propagate immediately
                    window.location.href = '/';
                }, 1500);
            } catch (error: any) {
                setStatus('error');
                setMessage(error.message || 'Magic login failed or link expired.');
            }
        };

        magicLogin();
    }, [token, onLoginSuccess, navigate]);

    return (
        <div className="min-h-screen bg-[#0f0821] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#1a1033] border border-purple-500/20 rounded-2xl shadow-2xl p-8 text-center">
                {status === 'verifying' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Logging you in...</h2>
                        <p className="text-gray-400">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-6">
                            <Sparkles className="w-8 h-8 text-purple-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Magic!</h2>
                        <p className="text-gray-400 mb-6">{message}</p>
                        <p className="text-xs text-purple-400/60 animate-pulse">Redirecting to Dashboard...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                            <AlertCircle className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Login Failed</h2>
                        <p className="text-gray-400 mb-6">{message}</p>
                        <button
                            onClick={() => navigate('/')}
                            className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-xl transition-all"
                        >
                            Back to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
