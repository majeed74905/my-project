
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

export interface AnalysisResult {
    results: any[];
    context_text: string;
}

export const analysisService = {
    async analyzeFiles(files: File[]): Promise<AnalysisResult> {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        const response = await fetch(`${API_URL}/analysis/analyze_files`, {
            method: 'POST',
            body: formData, // Fetch automatically sets Content-Type to multipart/form-data
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Analysis failed');
        }

        return response.json();
    }
};
