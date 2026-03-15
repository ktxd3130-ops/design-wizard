'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Sparkles, Download, Undo2, Redo2, Share2,
    Cloud, CheckCircle2, Loader2, MessageSquare, BarChart2, Shield, Plus
} from 'lucide-react';
import { FabricCanvas } from '@/core/FabricCanvas';
import { BrandConfig } from '@/core/config';
import { DesignState } from '@/core/types';

type HeaderMenu = 'file' | 'resize' | 'share' | 'analytics' | null;

export interface TopNavProps {
    fabricRef: React.RefObject<FabricCanvas | null>;
    brandConfig: BrandConfig | null;
    designState: DesignState;
    isAdmin: boolean;
    activeHeaderMenu: HeaderMenu;
    setActiveHeaderMenu: (menu: HeaderMenu) => void;
    onReviewClick: () => void;
}

export default function TopNav({
    fabricRef,
    brandConfig,
    designState,
    isAdmin,
    activeHeaderMenu,
    setActiveHeaderMenu,
    onReviewClick,
}: TopNavProps) {
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
    const [showSavedText, setShowSavedText] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const savedTextRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        setSaveStatus('saving');
        setShowSavedText(false);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (savedTextRef.current) clearTimeout(savedTextRef.current);

        debounceRef.current = setTimeout(() => {
            setSaveStatus('saved');
            setShowSavedText(true);
            savedTextRef.current = setTimeout(() => {
                setShowSavedText(false);
            }, 2000);
        }, 1500);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (savedTextRef.current) clearTimeout(savedTextRef.current);
        };
    }, [designState.objects, designState.backgroundColor]);

    return (
        <header className="h-[52px] bg-[#1e1e2e] border-b border-white/10 flex items-center px-4 gap-3 shrink-0 z-20">
            {/* Left cluster */}
            <div className="flex items-center gap-2 relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                    <Sparkles size={16} className="text-white" />
                </div>
                <button onClick={() => setActiveHeaderMenu(activeHeaderMenu === 'file' ? null : 'file')} className={`text-sm px-3 py-1.5 rounded-md transition-colors cursor-pointer ${activeHeaderMenu === 'file' ? 'bg-white/20 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>File</button>
                <button onClick={() => setActiveHeaderMenu(activeHeaderMenu === 'resize' ? null : 'resize')} className={`text-sm px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${activeHeaderMenu === 'resize' ? 'bg-white/20 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>
                    <Sparkles size={12} /> Resize
                </button>
            </div>

            {/* Undo/Redo & Sync */}
            <div className="flex items-center gap-1 ml-2 border-l border-white/10 pl-3">
                <button onClick={() => fabricRef.current?.undo()} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer" aria-label="Undo" title="Undo"><Undo2 size={16} /></button>
                <button onClick={() => fabricRef.current?.redo()} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer" aria-label="Redo" title="Redo"><Redo2 size={16} /></button>
                <div className="flex items-center gap-1.5 px-2 ml-1 text-white/40" title={saveStatus === 'saving' ? 'Saving changes...' : saveStatus === 'saved' ? 'Changes saved to cloud' : 'Auto-save enabled'}>
                    {saveStatus === 'saving' ? (
                        <>
                            <Cloud size={16} />
                            <Loader2 size={10} className="absolute ml-2.5 mt-2.5 animate-spin text-white/40" />
                            <span className="text-xs text-white/40">Saving...</span>
                        </>
                    ) : saveStatus === 'saved' && showSavedText ? (
                        <>
                            <Cloud size={16} className="text-green-400/70" />
                            <CheckCircle2 size={10} className="absolute ml-2.5 mt-2.5 bg-[#1e1e2e] rounded-full text-green-400/70" />
                            <span className="text-xs text-green-400/70">Saved</span>
                        </>
                    ) : (
                        <Cloud size={16} />
                    )}
                </div>
            </div>

            {/* Center title */}
            <div className="flex-1 flex justify-center">
                <span className="text-sm text-white/60 bg-white/5 px-4 py-1.5 rounded-lg border border-white/10">
                    {brandConfig?.name || 'Design'} — Custom Design
                </span>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
                {/* Collaborator Avatars */}
                <div className="flex items-center mr-2">
                    <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold ring-2 ring-[#1e1e2e] z-10" aria-label="Kendall Dale" title="Kendall Dale">K</div>
                    <button className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white ring-2 ring-[#1e1e2e] z-0 transition-colors ml-1 cursor-pointer" aria-label="Share Design" title="Share Design">
                        <Plus size={14} />
                    </button>
                </div>

                <button onClick={() => setActiveHeaderMenu(activeHeaderMenu === 'analytics' ? null : 'analytics')} className={`p-1.5 rounded-md transition-colors cursor-pointer ${activeHeaderMenu === 'analytics' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`} aria-label="Analytics" title="Analytics"><BarChart2 size={18} /></button>
                <button className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer" aria-label="Comments" title="Comments"><MessageSquare size={18} /></button>

                {isAdmin && (
                    <button
                        onClick={() => {
                            const json = fabricRef.current?.exportTemplateJSON();
                            if (!json) return;
                            const blob = new Blob([json], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a'); a.href = url;
                            a.download = `template_${designState.design_id}.json`; a.click();
                        }}
                        className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-white/80 px-3 py-1.5 rounded-lg transition-colors ml-2"
                    >
                        <Shield size={12} /> Export
                    </button>
                )}
                <button onClick={() => setActiveHeaderMenu(activeHeaderMenu === 'share' ? null : 'share')} className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ml-1 cursor-pointer ${activeHeaderMenu === 'share' ? 'bg-white/40 text-white' : 'bg-white/20 hover:bg-white/30 text-white'}`}>
                    <Share2 size={14} /> Share
                </button>
                <button
                    onClick={onReviewClick}
                    disabled={designState.objects.length === 0}
                    className={`flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg transition-colors font-medium shadow-lg ml-1 ${designState.objects.length === 0 ? 'bg-violet-600/50 text-white/50 cursor-not-allowed shadow-none' : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/25 cursor-pointer'}`}
                >
                    <Download size={14} /> Add to Cart
                </button>
            </div>
        </header>
    );
}
