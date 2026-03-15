'use client';

import React, { useState } from 'react';
import {
    ZoomIn, ZoomOut, Plus, Copy, Trash2, Grid, Maximize2,
    MoreHorizontal
} from 'lucide-react';
import { FabricCanvas } from '@/core/FabricCanvas';
import { DesignState, CanvasPage } from '@/core/types';

export interface BottomBarProps {
    fabricRef: React.RefObject<FabricCanvas | null>;
    zoom: number;
    setZoom: (z: number) => void;
    designState: DesignState;
    onSwitchPage: (index: number) => void;
    onAddPage: () => void;
    onDuplicatePage: (index: number) => void;
    onDeletePage: (index: number) => void;
}

export default function BottomBar({
    fabricRef,
    zoom,
    setZoom,
    designState,
    onSwitchPage,
    onAddPage,
    onDuplicatePage,
    onDeletePage,
}: BottomBarProps) {
    const [hoveredPage, setHoveredPage] = useState<number | null>(null);
    const [showPageMenu, setShowPageMenu] = useState<number | null>(null);

    const handleZoomChange = (newZoom: number) => {
        const clamped = Math.max(10, Math.min(500, newZoom));
        setZoom(clamped);
        if (fabricRef.current?.setManualZoom) {
            fabricRef.current.setManualZoom(clamped);
        }
    };

    const pages = designState.pages.length > 0 ? designState.pages : [{ id: 'default', label: 'Page 1', canvasJSON: '', preview: designState.preview }];
    const currentIndex = designState.currentPageIndex || 0;

    return (
        <div className="h-[52px] bg-[var(--surface-1)] border-t border-[var(--ui-5)] flex items-center px-5 shrink-0 justify-between gap-4">
            {/* Left: Page count */}
            <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-[var(--ui-40)]">
                    Page {currentIndex + 1} of {pages.length}
                </span>
            </div>

            {/* Center: Page thumbnails */}
            <div className="flex-1 flex items-center justify-center gap-2 overflow-x-auto scrollbar-hide px-4">
                {pages.map((page, idx) => (
                    <div
                        key={page.id}
                        className="relative group"
                        onMouseEnter={() => setHoveredPage(idx)}
                        onMouseLeave={() => { setHoveredPage(null); setShowPageMenu(null); }}
                    >
                        <button
                            onClick={() => onSwitchPage(idx)}
                            className={`relative w-[60px] h-[36px] rounded-md border-2 transition-all overflow-hidden shrink-0 ${
                                idx === currentIndex
                                    ? 'border-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.3)]'
                                    : 'border-[var(--ui-10)] hover:border-[var(--ui-30)]'
                            }`}
                        >
                            {page.preview ? (
                                <img src={page.preview} alt={page.label} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-[var(--ui-5)] flex items-center justify-center">
                                    <span className="text-[9px] text-[var(--ui-40)]">{idx + 1}</span>
                                </div>
                            )}
                        </button>
                        {/* Page number label */}
                        <span className="block text-center text-[9px] text-[var(--ui-40)] mt-px leading-none">{idx + 1}</span>

                        {/* Page context menu */}
                        {hoveredPage === idx && pages.length > 0 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowPageMenu(showPageMenu === idx ? null : idx); }}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--surface-2)] border border-[var(--ui-20)] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                                <MoreHorizontal size={8} />
                            </button>
                        )}
                        {showPageMenu === idx && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[var(--surface-2)] border border-[var(--ui-10)] rounded-lg shadow-xl z-50 overflow-hidden min-w-[120px]">
                                <button
                                    onClick={() => { onDuplicatePage(idx); setShowPageMenu(null); }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-[var(--ui-80)] hover:bg-[var(--ui-10)] flex items-center gap-2"
                                >
                                    <Copy size={10} /> Duplicate
                                </button>
                                {pages.length > 1 && (
                                    <button
                                        onClick={() => { onDeletePage(idx); setShowPageMenu(null); }}
                                        className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                                    >
                                        <Trash2 size={10} /> Delete
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
                {/* Add page button */}
                <button
                    onClick={onAddPage}
                    className="w-[60px] h-[36px] rounded-md border-2 border-dashed border-[var(--ui-10)] hover:border-violet-500/50 flex items-center justify-center text-[var(--ui-30)] hover:text-violet-400 transition-all shrink-0 cursor-pointer"
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* Right: Zoom controls */}
            <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => handleZoomChange(zoom - 10)} className="p-1.5 text-[var(--ui-40)] hover:text-[var(--ui-100)] hover:bg-[var(--ui-10)] rounded-md transition-colors cursor-pointer">
                    <ZoomOut size={14} />
                </button>
                <input
                    type="range"
                    min="10"
                    max="500"
                    value={zoom}
                    onChange={(e) => handleZoomChange(parseInt(e.target.value))}
                    className="w-24 accent-violet-500 cursor-pointer"
                />
                <span className="text-xs text-[var(--ui-60)] w-10 text-center font-mono">{zoom}%</span>
                <button onClick={() => handleZoomChange(zoom + 10)} className="p-1.5 text-[var(--ui-40)] hover:text-[var(--ui-100)] hover:bg-[var(--ui-10)] rounded-md transition-colors cursor-pointer">
                    <ZoomIn size={14} />
                </button>
                <div className="w-px h-5 bg-[var(--ui-10)] mx-1" />
                <button className="p-1.5 text-[var(--ui-40)] hover:text-[var(--ui-100)] hover:bg-[var(--ui-10)] rounded-md transition-colors cursor-pointer" title="Grid">
                    <Grid size={14} />
                </button>
                <button className="p-1.5 text-[var(--ui-40)] hover:text-[var(--ui-100)] hover:bg-[var(--ui-10)] rounded-md transition-colors cursor-pointer" title="Fullscreen">
                    <Maximize2 size={14} />
                </button>
            </div>
        </div>
    );
}
