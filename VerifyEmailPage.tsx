import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from './services/authService';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { AuthModal } from './components/AuthModal';

export const VerifyEmailPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying your email...');
    const [isAuthOpen, setIsAuthOpen] = useState(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link. Missing token.');
            return;
        }

        const verify = async () => {
            try {
                await authService.verifyToken(token);
                setStatus('success');
                setMessage('Email verified successfully! You can now log in.');
            } catch (error: any) {
                setStatus('error');
                setMessage(error.message || 'Verification failed or link expired.');
            }
        };

        verify();
    }, [token]);

    const handleLoginClick = () => {
        // Since this page might be outside the main app flow or the AuthModal is controlled by App.tsx,
        // we might not have direct access to open the modal unless passed down.
        // However, standard flow is to redirect to home and open login.
        // For now, simpler to just redirect to home with a query param or something, 
        // OR render the AuthModal here locally if needed.
        // Let's redirect to root and maybe show login?
        setIsAuthOpen(true);
    };

    return (
        <div className="min-h-screen bg-[#0f0821] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#1a1033] border border-purple-500/20 rounded-2xl shadow-2xl p-8 text-center">
                {status === 'verifying' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Verifying...</h2>
                        <p className="text-gray-400">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Verified!</h2>
                        <p className="text-gray-400 mb-6">{message}</p>
                        <button
                            onClick={() => {
                                navigate('/');
                                window.location.href = '/';
                            }}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                            <AlertCircle className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
                        <p className="text-gray-400 mb-6">{message}</p>
                        <button
                            onClick={() => {
                                navigate('/');
                                window.location.href = '/';
                            }}
                            className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-xl transition-all"
                        >
                            Back to Home
                        </button>
                    </div>
                )}
            </div>

            {/* Render AuthModal if user wants to login immediately? 
                 Actually better to just go Home and let them click Login.
              */}
        </div>
    );
};
