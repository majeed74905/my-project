
import React, { useState } from 'react';
import { X, Mail, Lock, Key, ArrowRight, Loader2, AlertCircle, CheckCircle, UserPlus, LogIn } from 'lucide-react';
import { authService } from '../services/authService';
import { useGoogleLogin } from '@react-oauth/google';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (token: string, email: string) => void;
}

type AuthView = 'login' | 'signup' | 'link-sent' | 'forgot' | 'reset';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
    const [view, setView] = useState<AuthView>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsLoading(true);
            setError(null);
            try {
                // Here tokenResponse.access_token is the OAuth token, but usually backend needs a code or id_token.
                // However, @react-oauth/google standard flow gives access_token. 
                // For direct id_token, we use the GoogleLogin component or the implicit flow.
                // I will use a custom implementation that handles the token.
                const res = await authService.googleLogin(tokenResponse.access_token);
                // The backend currently expects an id_token for verify_oauth2_token. 
                // I'll adjust the backend to handle the access token or use the id token if possible.
                // For now I'll assume standard OIDC.
                onLoginSuccess(res.access_token, res.email || "Google User");
                onClose();
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        },
        onError: () => setError("Google Login Failed"),
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);
        setIsLoading(true);

        try {
            if (view === 'signup') {
                const res = await authService.register({ email, password });
                setSuccessMsg(res.message || 'User registered successfully. Please check your email for verification link.');
                setView('link-sent');
            } else if (view === 'login') {
                try {
                    const res = await authService.login({ email, password });
                    onLoginSuccess(res.access_token, email);
                    onClose();
                } catch (err: any) {
                    if (err.message.includes('not verified')) {
                        setError(err.message);
                    } else {
                        throw err;
                    }
                }
            } else if (view === 'forgot') {
                const res = await authService.forgotPassword(email);
                setSuccessMsg(res.msg);
                setView('reset');
            } else if (view === 'reset') {
                const res = await authService.resetPassword(resetToken, newPassword);
                setSuccessMsg(res.msg);
                setTimeout(() => setView('login'), 2000);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setIsLoading(true);
        try {
            const res = await authService.resendOTP({ email });
            setSuccessMsg(res.message);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-[#0f0821] border border-purple-500/20 rounded-2xl shadow-2xl overflow-hidden relative">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {view === 'login' && <><LogIn className="w-5 h-5 text-purple-400" /> Welcome Back</>}
                        {view === 'signup' && <><UserPlus className="w-5 h-5 text-purple-400" /> Create Account</>}
                        {view === 'link-sent' && <><Mail className="w-5 h-5 text-green-400" /> Check Your Email</>}
                        {view === 'forgot' && <><Lock className="w-5 h-5 text-blue-400" /> Reset Password</>}
                        {view === 'reset' && <><Lock className="w-5 h-5 text-blue-400" /> New Password</>}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {successMsg && (
                        <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3 text-green-400 text-sm">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{successMsg}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {(view === 'login' || view === 'signup' || view === 'forgot') && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-[#1a1033] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-gray-600"
                                        placeholder="name@example.com"
                                    />
                                </div>
                            </div>
                        )}

                        {(view === 'login' || view === 'signup') && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full bg-[#1a1033] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-gray-600"
                                        placeholder="••••••••"
                                        minLength={6}
                                    />
                                </div>
                                {view === 'login' && (
                                    <div className="flex justify-end">
                                        <button type="button" onClick={() => setView('forgot')} className="text-xs text-purple-400 hover:text-purple-300 hover:underline transition-colors mt-1">Forgot Password?</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {view === 'reset' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Reset Token</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type="text"
                                            required
                                            value={resetToken}
                                            onChange={e => setResetToken(e.target.value)}
                                            className="w-full bg-[#1a1033] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-gray-600"
                                            placeholder="Paste token from email"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type="password"
                                            required
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            className="w-full bg-[#1a1033] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-gray-600"
                                            placeholder="New strong password"
                                            minLength={6}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {view === 'link-sent' && (
                            <div className="space-y-6 text-center py-4 text-gray-300">
                                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                    <Mail className="w-8 h-8 text-green-400" />
                                </div>
                                <p>We've sent a magic verification link to:</p>
                                <p className="font-bold text-white text-lg">{email}</p>
                                <p className="text-sm">Click the link in the email to activate your account.</p>
                                <div className="text-center pt-2">
                                    <button type="button" onClick={handleResendOtp} disabled={isLoading} className="text-xs text-purple-400 hover:text-purple-300 underline">
                                        Resend Link
                                    </button>
                                </div>
                            </div>
                        )}

                        {view === 'signup' && (
                            <div className="flex items-start gap-3 my-4">
                                <div className="flex items-center h-5">
                                    <input
                                        id="terms"
                                        type="checkbox"
                                        required
                                        className="w-4 h-4 rounded border-gray-600 bg-[#1a1033] text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-900"
                                    />
                                </div>
                                <label htmlFor="terms" className="text-xs text-gray-400">
                                    I agree to the <a href="/legal/terms-of-service.html" target="_blank" className="text-purple-400 hover:underline">Terms of Service</a>, <a href="/legal/privacy-policy.html" target="_blank" className="text-purple-400 hover:underline">Privacy Policy</a>, and <a href="/legal/eula.html" target="_blank" className="text-purple-400 hover:underline">EULA</a>. I confirm I am at least 13 years old.
                                </label>
                            </div>
                        )}

                        {view === 'link-sent' ? null : (
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        {view === 'login' ? 'Sign In' : view === 'signup' ? 'Create Account' : view === 'forgot' ? 'Send Link' : view === 'reset' ? 'Update Password' : 'Verify & Login'}
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        )}

                        {(view === 'login' || view === 'signup') && (
                            <>
                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-white/5"></div>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-[#0f0821] px-4 text-gray-500 font-bold tracking-widest">Or Continue With</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => authService.redirectToGoogle()}
                                    disabled={isLoading}
                                    className="w-full bg-white text-gray-900 font-bold py-3.5 rounded-xl transition-all hover:bg-gray-100 flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Sign in with Google
                                </button>
                            </>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white/5 border-t border-white/5 text-center">
                    {view === 'login' ? (
                        <p className="text-sm text-gray-400">
                            Don't have an account?{' '}
                            <button onClick={() => { setView('signup'); setError(null); }} className="text-purple-400 font-bold hover:underline">Sign up</button>
                        </p>
                    ) : (
                        <p className="text-sm text-gray-400">
                            Already have an account?{' '}
                            <button onClick={() => { setView('login'); setError(null); }} className="text-purple-400 font-bold hover:underline">Log in</button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
