'use client';

import React from 'react';
import {
    AlignLeft, Minus, Plus, ChevronRight, LayoutGrid
} from 'lucide-react';
import { FabricCanvas } from '@/core/FabricCanvas';

export interface BottomBarProps {
    fabricRef: React.RefObject<FabricCanvas | null>;
    zoom: number;
    setZoom: (z: number) => void;
}

export default function BottomBar({
    fabricRef,
    zoom,
    setZoom,
}: BottomBarProps) {
    return (
        <div className="h-[48px] bg-[#1e1e2e] border-t border-white/5 flex items-center px-4 shrink-0 justify-between">
            {/* Left: Notes & Timer */}
            <div className="flex items-center gap-4">
                <button className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors cursor-pointer">
                    <AlignLeft size={14} /> Notes
                </button>
                <button className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors cursor-pointer">
                    <div className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center"><Minus size={6} className="rotate-90" /></div> Timer
                </button>
            </div>

            {/* Center: Slide/Page Thumbnails */}
            <div className="flex items-center gap-4 absolute left-1/2 -translate-x-1/2">
                <div className="h-8 w-12 bg-white rounded flex items-center justify-center text-[10px] text-black font-semibold shadow-sm border-2 border-violet-500 cursor-pointer" aria-label="Current Page" title="Current Page">
                    1
                </div>
                <button disabled={true} className="h-8 px-2 bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center text-white/50 transition-colors" aria-label="Add Page" title="Add Page">
                    <Plus size={14} /> <ChevronRight size={14} className="rotate-90 ml-1 opacity-50" />
                </button>
            </div>

            {/* Right: Zoom slider, Grid view, Fullscreen */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <input
                        type="range"
                        min="10"
                        max="500"
                        value={zoom}
                        onChange={(e) => {
                            const z = parseInt(e.target.value);
                            setZoom(z);
                            // Update actual canvas + DOM dimensions
                            if (fabricRef.current && (fabricRef.current as any).setManualZoom) {
                                (fabricRef.current as any).setManualZoom(z);
                            } else {
                                fabricRef.current?.canvas.setZoom(z / 100);
                                fabricRef.current?.canvas.requestRenderAll();
                            }
                        }}
                        className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                        aria-label="Zoom Level"
                        title="Zoom Level"
                    />
                    <span className="text-xs text-white/70 min-w-[32px]">{zoom}%</span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-2 text-xs text-white/50">
                    <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded cursor-pointer hover:bg-white/10 hover:text-white transition-colors" aria-label="Page List" title="Page List">
                        <LayoutGrid size={14} /> Pages 1 / 1
                    </span>
                    <button className="p-1.5 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer" aria-label="Grid View" title="Grid View"><LayoutGrid size={14} /></button>
                    <button className="p-1.5 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer" aria-label="Fullscreen View" title="Fullscreen View"><Minus size={14} className="rotate-45" /></button>
                </div>
            </div>
        </div>
    );
}
