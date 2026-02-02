
import { UserCreate, UserLogin, OTPVerify, ResendOTP } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const authService = {
    async register(data: UserCreate) {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Registration failed');
        }
        return response.json() as Promise<{ message?: string; email: string }>;
    },

    async login(data: UserLogin) {
        // OAuth2PasswordRequestForm expects form-urlencoded data
        const formData = new URLSearchParams();
        formData.append('username', data.email); // standard expects username
        formData.append('password', data.password);

        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }
        return response.json() as Promise<{ access_token: string; token_type: string }>;
    },

    async verifyToken(token: string) {
        const response = await fetch(`${API_URL}/auth/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Verification failed');
        }
        return response.json() as Promise<{ msg: string; }>;
    },

    async resendOTP(data: ResendOTP) {
        const response = await fetch(`${API_URL}/auth/resend-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to resend OTP');
        }
        return response.json() as Promise<{ message: string }>;
    },

    async forgotPassword(email: string) {
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Request failed');
        }
        return response.json() as Promise<{ msg: string }>;
    },

    async resetPassword(token: string, newPassword: string) {
        const response = await fetch(`${API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, new_password: newPassword }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Reset failed');
        }
        return response.json() as Promise<{ msg: string }>;
    },

    async googleLogin(token: string) {
        const response = await fetch(`${API_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Google Login failed');
        }
        return response.json() as Promise<{ access_token: string; token_type: string; email?: string }>;
    },

    async magicLogin(token: string) {
        const response = await fetch(`${API_URL}/auth/magic-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Magic login failed');
        }
        return response.json() as Promise<{ access_token: string; refresh_token: string; token_type: string; email: string }>;
    },

    redirectToGoogle() {
        window.location.href = `${API_URL}/auth/google/login`;
    },

    async setPrivacyMode(isEnabled: boolean) {
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/users/me/privacy?is_enabled=${isEnabled}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });
        if (!response.ok) {
            throw new Error('Failed to update privacy settings');
        }
        return response.json();
    }
};
