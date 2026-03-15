'use client';

import React from 'react';
import {
    AlertTriangle, Loader2, Trash2, Copy,
    Bold, Italic, Minus, Plus, Sparkles, Layers,
    ChevronDown, Crop, Lock, Unlock, ArrowUpToLine, ArrowDownToLine,
    Pen, LayoutGrid
} from 'lucide-react';
import { FabricCanvas } from '@/core/FabricCanvas';
import { DesignState } from '@/core/types';

export interface FloatingHUDProps {
    fabricRef: React.RefObject<FabricCanvas | null>;
    designState: DesignState;
    isRemovingBg: boolean;
    onRemoveBg: () => void;
}

export default function FloatingHUD({
    fabricRef,
    designState,
    isRemovingBg,
    onRemoveBg,
}: FloatingHUDProps) {
    const activeObj = designState.activeObjectId
        ? fabricRef.current?.canvas.getObjects().find((o: any) => o.id === designState.activeObjectId) as any
        : null;

    const isTextSelected = activeObj?.type === 'text' || activeObj?.type === 'textbox' || activeObj?.type === 'i-text';
    const isShapeSelected = activeObj?.type === 'rect' || activeObj?.type === 'circle' || activeObj?.type === 'triangle';

    if (!designState.activeObjectId || !designState.activeObjectBox || !activeObj) return null;

    return (
        <div
            className="absolute z-50 flex items-center gap-2 px-3.5 py-2 bg-white text-gray-800 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-black/5 rounded-[10px] pointer-events-auto transition-transform"
            style={{
                left: designState.activeObjectBox.left + (designState.activeObjectBox.width / 2),
                top: designState.activeObjectBox.top < 60
                    ? designState.activeObjectBox.top + designState.activeObjectBox.height + 20
                    : designState.activeObjectBox.top - 54,
                transform: 'translateX(-50%)',
                fontFamily: "'Inter', sans-serif"
            }}
        >
            {/* Dynamic Toolset based on Object Type */}
            {isTextSelected ? (
                <>
                    <button className="flex justify-between items-center w-24 px-2 py-1.5 hover:bg-black/5 rounded text-xs font-semibold cursor-pointer">
                        <span>{activeObj?.fontFamily || 'Inter'}</span> <ChevronDown size={12} className="opacity-50" />
                    </button>
                    <div className="w-px h-4 bg-black/10 mx-1.5" />
                    <div className="flex items-center">
                        <button className="p-1 hover:bg-black/5 rounded cursor-pointer" onClick={() => fabricRef.current?.updateActiveObjectProperty('fontSize', (activeObj?.fontSize || 24) - 2)}><Minus size={14} /></button>
                        <input type="text" value={activeObj?.fontSize || 24} readOnly className="w-8 text-center bg-transparent text-xs font-semibold outline-none pointer-events-none" />
                        <button className="p-1 hover:bg-black/5 rounded cursor-pointer" onClick={() => fabricRef.current?.updateActiveObjectProperty('fontSize', (activeObj?.fontSize || 24) + 2)}><Plus size={14} /></button>
                    </div>
                    <div className="w-px h-4 bg-black/10 mx-1.5" />
                    <button onClick={() => fabricRef.current?.toggleActiveObjectProperty('fontWeight', 'bold', 'normal')} className={`p-1.5 hover:bg-black/5 rounded cursor-pointer ${activeObj?.fontWeight === 'bold' ? 'bg-black/10 text-black' : 'text-gray-500'}`}><Bold size={14} /></button>
                    <button onClick={() => fabricRef.current?.toggleActiveObjectProperty('fontStyle', 'italic', 'normal')} className={`p-1.5 hover:bg-black/5 rounded cursor-pointer ${activeObj?.fontStyle === 'italic' ? 'bg-black/10 text-black' : 'text-gray-500'}`}><Italic size={14} /></button>
                </>
            ) : isShapeSelected ? (
                <>
                    <button className="p-1.5 hover:bg-black/5 rounded cursor-pointer flex items-center justify-center">
                        <div className="w-5 h-5 rounded border border-black/20" style={{ backgroundColor: activeObj.fill || '#000000' }} />
                    </button>
                    <div className="w-px h-4 bg-black/10 mx-1.5" />
                    <button className="p-1.5 text-gray-500 hover:text-black hover:bg-black/5 rounded cursor-pointer transition-colors" title="Stroke">
                        <Pen size={14} />
                    </button>
                    {activeObj.type === 'rect' && (
                        <button className="p-1.5 text-gray-500 hover:text-black hover:bg-black/5 rounded cursor-pointer transition-colors" title="Corner Radius">
                            <LayoutGrid size={14} />
                        </button>
                    )}
                    <div className="w-px h-4 bg-black/10 mx-1.5" />
                    <div className="flex items-center gap-1">
                        <Layers size={12} className="text-gray-400" />
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={Math.round((activeObj?.opacity ?? 1) * 100)}
                            onChange={(e) => fabricRef.current?.setOpacity(parseInt(e.target.value))}
                            className="w-16 accent-violet-500 cursor-pointer h-1"
                        />
                        <span className="text-[9px] text-gray-400 w-6">{Math.round((activeObj?.opacity ?? 1) * 100)}%</span>
                    </div>
                </>
            ) : (
                <>
                    <button
                        onClick={onRemoveBg}
                        disabled={isRemovingBg}
                        className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-black/5 rounded text-xs font-semibold cursor-pointer text-violet-600 disabled:opacity-50"
                    >
                        {isRemovingBg ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} AI Remove BG
                    </button>
                    <div className="w-px h-4 bg-black/10 mx-1.5" />
                    <button className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-black/5 rounded text-xs font-semibold cursor-pointer">
                        <Crop size={14} /> Crop
                    </button>
                    <div className="w-px h-4 bg-black/10 mx-1.5" />
                    <div className="flex items-center gap-1">
                        <Layers size={12} className="text-gray-400" />
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={Math.round((activeObj?.opacity ?? 1) * 100)}
                            onChange={(e) => fabricRef.current?.setOpacity(parseInt(e.target.value))}
                            className="w-16 accent-violet-500 cursor-pointer h-1"
                        />
                        <span className="text-[9px] text-gray-400 w-6">{Math.round((activeObj?.opacity ?? 1) * 100)}%</span>
                    </div>
                </>
            )}

            {/* Global Tools (Always appear for any object) */}
            <div className="w-px h-4 bg-black/10 mx-1.5" />
            <button onClick={() => activeObj && fabricRef.current?.toggleLock(activeObj.id)} className={`p-1.5 hover:text-black hover:bg-black/5 rounded cursor-pointer transition-colors ${activeObj?.locked ? 'text-red-500 bg-red-50' : 'text-gray-500'}`} title={activeObj?.locked ? "Unlock" : "Lock"}>
                {activeObj?.locked ? <Lock size={14} /> : <Unlock size={14} />}
            </button>
            <button onClick={() => fabricRef.current?.bringForward()} className="p-1.5 text-gray-500 hover:text-black hover:bg-black/5 rounded cursor-pointer transition-colors" title="Bring Forward"><ArrowUpToLine size={14} /></button>
            <button onClick={() => fabricRef.current?.sendBackwards()} className="p-1.5 text-gray-500 hover:text-black hover:bg-black/5 rounded cursor-pointer transition-colors" title="Send Backward"><ArrowDownToLine size={14} /></button>
            <button onClick={() => fabricRef.current?.copy().then(() => fabricRef.current?.paste())} className="p-1.5 text-gray-500 hover:text-black hover:bg-black/5 rounded cursor-pointer transition-colors" title="Duplicate"><Copy size={14} /></button>
            <button onClick={() => fabricRef.current?.deleteSelected()} className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded cursor-pointer transition-colors" title="Delete"><Trash2 size={14} /></button>

            {/* Production Warnings (DPI) */}
            {designState.warnings.some(w => w.objectId === designState.activeObjectId) && (
                <>
                    <div className="w-px h-4 bg-black/10 mx-1.5" />
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold border border-red-200 uppercase tracking-widest shadow-sm">
                        <AlertTriangle size={10} className="animate-pulse" /> Warning
                    </div>
                </>
            )}
        </div>
    );
}
