import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose', // allow click events
    flowchart: { useMaxWidth: false },
});

interface MermaidProps {
    chart: string;
    tooltips?: Record<string, string>;
}

export default function Mermaid({ chart, tooltips }: MermaidProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [tooltipContent, setTooltipContent] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (!containerRef.current || !chart) return;

        const renderChart = async () => {
            try {
                const res = await mermaid.render('mermaid-svg-' + Math.random().toString(36).substring(7), chart);
                if (containerRef.current) {
                    containerRef.current.innerHTML = res.svg;

                    // Attach listeners to standard mermaid shapes
                    const nodes = containerRef.current.querySelectorAll('.node');
                    nodes.forEach(node => {
                        const nodeIdRaw = node.getAttribute('id') || '';

                        // Mermaid generates IDs like flowchart-nodeStart-5, we extract the middle part 'nodeStart'
                        const parts = nodeIdRaw.split('-');
                        if (parts.length >= 2) {
                            const nodeId = parts[1];

                            let detailStr = null;
                            if (tooltips && tooltips[nodeId]) {
                                detailStr = tooltips[nodeId];
                            }

                            if (detailStr) {
                                (node as HTMLElement).style.cursor = 'pointer';

                                node.addEventListener('mouseenter', () => {
                                    setTooltipContent(detailStr);
                                });
                                node.addEventListener('mouseleave', () => {
                                    setTooltipContent(null);
                                });
                                // Mobile fallback
                                node.addEventListener('touchstart', (e) => {
                                    setTooltipContent(detailStr);
                                });
                                node.addEventListener('touchend', () => {
                                    setTooltipContent(null);
                                });
                            }
                        }
                    });
                }
            } catch (error) {
                console.error('Mermaid rendering error:', error);
            }
        };
        renderChart();

    }, [chart, tooltips]);

    return (
        <div
            className="relative w-full flex flex-col items-center bg-slate-50 rounded-xl border border-slate-200 overflow-hidden"
            onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
        >
            {/* Tooltip Overlay - Now follows the mouse */}
            {tooltipContent && (
                <div
                    className="fixed z-[100] p-4 bg-slate-900 border border-slate-700 shadow-2xl rounded-xl text-slate-100 backdrop-blur-md font-mono text-sm max-w-sm break-words whitespace-pre-wrap pointer-events-none transition-opacity animate-in fade-in"
                    style={{ left: mousePos.x + 15, top: mousePos.y + 15 }}
                >
                    <p><b>🔍 Khối thao tác (Code gốc):</b></p>
                    <div className="mt-2 text-green-400">
                        {tooltipContent}
                    </div>
                </div>
            )}

            <TransformWrapper
                initialScale={1}
                minScale={0.1}
                maxScale={4}
                centerOnInit={true}
                wheel={{ step: 0.1 }}
            >
                <TransformComponent wrapperStyle={{ width: "100%", height: "500px" }}>
                    <div ref={containerRef} className="flex justify-center items-center w-full h-full p-8" />
                </TransformComponent>
            </TransformWrapper>
        </div>
    );
}
