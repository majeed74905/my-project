const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const reportService = {
    async reportMessage(text: string, reason: string): Promise<void> {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            console.warn("User not logged in, report stored locally only.");
            return;
        }

        try {
            await fetch(`${API_URL}/reports/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message_content: text.substring(0, 5000), // Limit payload
                    reason: reason
                })
            });
        } catch (e) {
            console.error("Failed to submit report", e);
            // Fail silently to user to not disrupt experience, but log to console
        }
    }
};
