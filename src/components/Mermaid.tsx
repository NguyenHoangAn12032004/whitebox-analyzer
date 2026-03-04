import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose', // allow click events
});

interface MermaidProps {
    chart: string;
    tooltips?: Record<string, string>;
}

export default function Mermaid({ chart, tooltips }: MermaidProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [tooltipContent, setTooltipContent] = useState<string | null>(null);

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
                        // Extract the Node ID text rendered by Mermaid inside the shape
                        const textElement = node.querySelector('.nodeLabel');
                        const rawText = textElement?.textContent?.trim();

                        // We are looking for something like "#1" or "1" or "N1" depending on what the LLM printed inside the box
                        // Let's rely directly on the SVG element's inner ID which Mermaid preserves (e.g. id="flowchart-N1-xxxx")
                        const nodeIdRaw = node.getAttribute('id') || '';

                        // Mermaid generates IDs like flowchart-nodeStart-5, we extract the middle part 'nodeStart'
                        const parts = nodeIdRaw.split('-');
                        if (parts.length >= 2) {
                            const nodeId = parts[1];

                            let detailStr = null;
                            // Find tooltip text if it exists
                            if (tooltips && tooltips[nodeId]) {
                                detailStr = tooltips[nodeId];
                            }

                            if (detailStr) {
                                // Add styling to show it's interactive
                                (node as HTMLElement).style.cursor = 'pointer';

                                // Mousedown/Click for Mobile
                                node.addEventListener('mousedown', (e) => {
                                    e.preventDefault();
                                    setTooltipContent(detailStr);
                                });
                                // Hover for Desktop
                                node.addEventListener('mouseenter', () => {
                                    setTooltipContent(detailStr);
                                });
                                node.addEventListener('mouseleave', () => {
                                    setTooltipContent(null);
                                });
                                node.addEventListener('mouseup', () => {
                                    setTooltipContent(null); // mobile cleanup
                                });
                                node.addEventListener('touchstart', (e) => {
                                    e.preventDefault();
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
        <div className="relative w-full flex flex-col items-center">
            {/* Tooltip Overlay */}
            {tooltipContent && (
                <div className="absolute top-4 z-50 p-4 bg-slate-900 border border-slate-700 shadow-2xl rounded-xl text-slate-100 backdrop-blur-md font-mono text-sm max-w-sm w-[90%] left-1/2 -translate-x-1/2 pointer-events-none break-words whitespace-pre-wrap transition-opacity animate-in fade-in zoom-in-95 duration-200">
                    <p><b>🔍 Khối thao tác (Code gốc):</b></p>
                    <div className="mt-2 text-green-400">
                        {tooltipContent}
                    </div>
                </div>
            )}
            <div ref={containerRef} className="flex justify-center w-full min-h-[300px] overflow-auto cursor-pointer" />
        </div>
    );
}
