import React, { useEffect, useRef, useState } from 'react';
import Viz from 'viz.js';
import { Module, render } from 'viz.js/full.render.js';
import { Download, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface GraphvizDiagramProps {
    dot: string;
}

const GraphvizDiagram: React.FC<GraphvizDiagramProps> = ({ dot }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Pan & Zoom state
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!dot || !containerRef.current) return;

        setIsLoading(true);
        setError(null);
        setScale(1);
        setPosition({ x: 0, y: 0 });

        const viz = new Viz({ Module, render });

        viz.renderSVGElement(dot)
            .then((element: SVGSVGElement) => {
                if (containerRef.current) {
                    containerRef.current.innerHTML = '';
                    // Allow sizing based on wrapper size to support zooming
                    element.style.width = '100%';
                    element.style.height = 'auto';
                    containerRef.current.appendChild(element);
                }
                setIsLoading(false);
            })
            .catch((err: Error) => {
                setError(`Failed to render diagram:\n${err.message}`);
                setIsLoading(false);
            });
    }, [dot]);

    const handleDownload = () => {
        const svg = containerRef.current?.querySelector('svg');
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'architecture.svg';
            link.click();
            URL.revokeObjectURL(url);
        }
    };

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const scaleAdjust = e.deltaY > 0 ? 0.9 : 1.1;
            setScale(prev => Math.min(Math.max(0.1, prev * scaleAdjust), 5));
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.current.x,
            y: e.clientY - dragStart.current.y
        });
    };

    const handleMouseUp = () => setIsDragging(false);
    const handleMouseLeave = () => setIsDragging(false);

    const zoomIn = () => setScale(prev => Math.min(prev * 1.2, 5));
    const zoomOut = () => setScale(prev => Math.max(prev * 0.8, 0.1));
    const resetZoom = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    return (
        <div className="relative group my-4 rounded-lg overflow-hidden border border-white/10 bg-black/40 flex flex-col h-full min-h-[400px]">
            {/* Header controls */}
            <div className="flex justify-between items-center px-4 py-2 bg-white/5 border-b border-white/5 text-xs font-mono text-gray-400 z-10 w-full">
                <span>Graphviz Architecture</span>
                <div className="flex items-center gap-3">
                    <button onClick={zoomIn} title="Zoom In" className="hover:text-white transition-colors"><ZoomIn className="w-4 h-4" /></button>
                    <button onClick={zoomOut} title="Zoom Out" className="hover:text-white transition-colors"><ZoomOut className="w-4 h-4" /></button>
                    <button onClick={resetZoom} title="Reset Scale" className="hover:text-white transition-colors"><Maximize className="w-4 h-4" /></button>
                    <div className="w-px h-3 bg-white/20 mx-1"></div>
                    <button className="hover:text-white transition-colors flex items-center gap-1" onClick={handleDownload} title="Download SVG">
                        <Download className="w-4 h-4" /> SVG
                    </button>
                </div>
            </div>

            {/* Canvas area */}
            <div
                ref={wrapperRef}
                className={`relative flex-1 overflow-hidden w-full flex justify-center items-center bg-black/20 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                style={{ touchAction: 'none' }} // Prevents browser scroll on touch
            >
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20 backdrop-blur-sm">
                        <div className="text-primary animate-pulse flex flex-col items-center gap-2">
                            <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-xs font-bold tracking-widest uppercase">Rendering Digraph...</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center p-6 text-center z-20 bg-black/50">
                        <div className="text-red-400 bg-red-900/20 px-6 py-4 rounded-xl border border-red-500/30 font-mono text-sm max-w-lg shadow-xl shadow-red-900/20">
                            <span className="font-bold flex items-center justify-center gap-2 mb-2">⚠️ Digraph Syntax Error</span>
                            <span className="opacity-80 whitespace-pre-wrap">{error}</span>
                        </div>
                    </div>
                )}

                <div
                    ref={containerRef}
                    className="flex justify-center items-center select-none w-full max-w-4xl min-h-[300px]"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transformOrigin: 'center center',
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                    }}
                >
                </div>
            </div>
            {/* Helper tip */}
            <div className="absolute bottom-2 right-4 text-[10px] text-white/30 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                Ctrl + Scroll to Zoom • Drag to Pan
            </div>
        </div>
    );
};

export default GraphvizDiagram;
