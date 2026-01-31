const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const analysisService = {
    async analyzeFiles(files: File[]): Promise<{ context_text: string; results: any[] }> {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        const response = await fetch(`${API_URL}/analysis/analyze_files`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`File analysis failed: ${response.statusText}`);
        }

        return response.json();
    }
};
