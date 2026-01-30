
import React, { useState, useEffect, useRef } from 'react';
import { Download, FileDown, Loader2, AlertTriangle, Workflow } from 'lucide-react';

interface DiagramProps {
    schema: any;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

export const DiagramSystem: React.FC<DiagramProps> = ({ schema }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [svgUrl, setSvgUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const fetchDiagram = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch PNG
                const pngRes = await fetch(`${API_URL}/diagram/render`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(schema)
                });

                if (!pngRes.ok) throw new Error(await pngRes.text() || 'Failed to render PNG');
                const pngBlob = await pngRes.blob();
                setImageUrl(URL.createObjectURL(pngBlob));

                // Fetch SVG
                const svgRes = await fetch(`${API_URL}/diagram/render-svg`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(schema)
                });

                if (!svgRes.ok) throw new Error(await svgRes.text() || 'Failed to render SVG');
                const svgBlob = await svgRes.blob();
                setSvgUrl(URL.createObjectURL(svgBlob));

                setIsLoading(false);
            } catch (err: any) {
                console.error('Diagram render error:', err);
                setError(err.message || 'Rendering service unavailable');
                setIsLoading(false);
            }
        };

        if (schema) fetchDiagram();
    }, [schema]);

    const handleDownload = (type: 'png' | 'svg') => {
        const url = type === 'png' ? imageUrl : svgUrl;
        if (!url) return;

        const link = document.createElement('a');
        link.href = url;
        link.download = `zara-diagram-${Date.now()}.${type}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="my-4 overflow-hidden rounded-xl bg-white border border-border shadow-lg animate-scale-in">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <Workflow className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AI Visualization (Graphviz)</span>
                </div>
                <div className="flex items-center gap-2">
                    {!isLoading && !error && (
                        <>
                            <button
                                onClick={() => handleDownload('png')}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                                <Download className="w-3 h-3" /> PNG
                            </button>
                            <button
                                onClick={() => handleDownload('svg')}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                                <FileDown className="w-3 h-3" /> SVG
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="p-4 flex justify-center bg-white min-h-[150px] relative">
                {error ? (
                    <div className="flex flex-col items-center gap-3 p-6 text-center max-w-md">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 mb-1">Architecture Error</p>
                            <p className="text-xs text-slate-500">{error}</p>
                        </div>
                    </div>
                ) : isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Synthesizing Diagram...</span>
                    </div>
                ) : imageUrl ? (
                    <img src={imageUrl} alt="AI generated diagram" className="max-w-full h-auto rounded-lg shadow-sm" />
                ) : null}
            </div>
        </div>
    );
};
