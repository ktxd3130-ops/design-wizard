'use client';

import React from 'react';
import {
    Plus, Copy, Download, Settings2, FolderOpen,
    Sparkles, Activity, Eye, MousePointer2, Link
} from 'lucide-react';
import { FabricCanvas } from '@/core/FabricCanvas';
import { DesignState } from '@/core/types';

type HeaderMenu = 'file' | 'resize' | 'share' | 'analytics' | null;

export interface HeaderDropdownsProps {
    activeHeaderMenu: HeaderMenu;
    setActiveHeaderMenu: (menu: HeaderMenu) => void;
    fabricRef: React.RefObject<FabricCanvas | null>;
    designState: DesignState;
    isAdmin: boolean;
}

export default function HeaderDropdowns({
    activeHeaderMenu,
    setActiveHeaderMenu,
    fabricRef,
    designState,
    isAdmin,
}: HeaderDropdownsProps) {
    if (!activeHeaderMenu) return null;

    return (
        <div
            className="fixed inset-0 z-40"
            onClick={() => setActiveHeaderMenu(null)}
        >
            <div className="absolute top-[56px] w-[280px] bg-[#252536] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 flex flex-col pointer-events-auto" onClick={e => e.stopPropagation()} style={
                activeHeaderMenu === 'file' ? { left: '48px' } :
                    activeHeaderMenu === 'resize' ? { left: '100px' } :
                        activeHeaderMenu === 'share' ? { right: '140px', width: '320px' } :
                            { right: '180px', width: '300px' } // Analytics
            }>
                {activeHeaderMenu === 'file' && (
                    <div className="p-2 space-y-0.5">
                        <button className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg text-sm transition-colors flex items-center justify-between group cursor-pointer text-white/90">
                            <div className="flex items-center gap-3"><Plus size={16} className="text-white/50 group-hover:text-white" /> Create new design</div>
                        </button>
                        <button className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg text-sm transition-colors flex items-center justify-between group cursor-pointer text-white/90">
                            <div className="flex items-center gap-3"><FolderOpen size={16} className="text-white/50 group-hover:text-white" /> Save to folder</div>
                        </button>
                        <div className="h-px bg-white/10 my-1 mx-2" />
                        <button className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg text-sm transition-colors flex items-center justify-between group cursor-pointer text-white/90">
                            <div className="flex items-center gap-3"><Copy size={16} className="text-white/50 group-hover:text-white" /> Make a copy</div>
                        </button>
                        <button className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg text-sm transition-colors flex items-center justify-between group cursor-pointer text-white/90">
                            <div className="flex items-center gap-3"><Download size={16} className="text-white/50 group-hover:text-white" /> Download</div>
                            <span className="text-[10px] text-white/40 tracking-widest font-mono">⌘D</span>
                        </button>
                        <button className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg text-sm transition-colors flex items-center justify-between group cursor-pointer text-white/90">
                            <div className="flex items-center gap-3"><Settings2 size={16} className="text-white/50 group-hover:text-white" /> Version history</div>
                        </button>
                    </div>
                )}

                {activeHeaderMenu === 'resize' && (
                    <div className="p-4">
                        <h4 className="text-sm font-semibold mb-3">Custom Size</h4>
                        <div className="flex gap-2 mb-4">
                            <div className="flex-1 bg-black/20 rounded-lg p-2 border border-white/10">
                                <div className="text-[10px] text-white/40 uppercase font-semibold mb-1">Width</div>
                                <input type="text" defaultValue="800" className="w-full bg-transparent text-sm focus:outline-none" />
                            </div>
                            <div className="flex-1 bg-black/20 rounded-lg p-2 border border-white/10">
                                <div className="text-[10px] text-white/40 uppercase font-semibold mb-1">Height</div>
                                <input type="text" defaultValue="600" className="w-full bg-transparent text-sm focus:outline-none" />
                            </div>
                            <div className="bg-black/20 rounded-lg p-2 border border-white/10 flex items-center justify-center">
                                <span className="text-sm text-white/60 px-1">px</span>
                            </div>
                        </div>
                        <div className="h-px bg-white/10 mb-4" />
                        <button className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 text-white font-medium py-2 rounded-lg text-sm flex items-center justify-center gap-2 cursor-pointer transition-opacity">
                            <Sparkles size={16} /> Magic Resize
                        </button>
                    </div>
                )}

                {activeHeaderMenu === 'share' && (
                    <div className="p-4 flex flex-col gap-4">
                        <div className="flex items-center justify-between w-full p-2 bg-black/20 rounded-lg border border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold text-xs">K</div>
                                <div className="text-sm font-medium">Kendall Dale (You)</div>
                            </div>
                            <span className="text-xs text-white/50">Owner</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs font-semibold text-white/60 uppercase mb-1">Collaboration Link</div>
                            <div className="flex items-center w-full bg-black/20 rounded-lg border border-white/10 overflow-hidden">
                                <div className="p-2 border-r border-white/10 text-white/40"><Link size={14} /></div>
                                <div className="flex-1 px-3 text-sm text-white/70 overflow-hidden text-ellipsis whitespace-nowrap bg-transparent outline-none py-2 pointer-events-none">https://stickylife.com/design/abc-123</div>
                                <button className="px-3 py-2 text-sm text-violet-400 font-semibold hover:bg-white/5 transition-colors cursor-pointer">Copy</button>
                            </div>
                            <select className="w-full bg-transparent text-sm text-white/80 p-2 border border-white/10 rounded-lg mt-1 outline-none appearance-none cursor-pointer">
                                <option value="anyone" className="bg-[#252536]">Anyone with the link can edit</option>
                                <option value="restricted" className="bg-[#252536]">Only people invited can access</option>
                            </select>
                        </div>
                        <button className="w-full mt-2 bg-white/10 hover:bg-white/20 text-white font-medium py-2 rounded-lg text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors border border-white/5">
                            <Download size={16} /> Download
                        </button>
                    </div>
                )}

                {activeHeaderMenu === 'analytics' && (
                    <div className="p-4">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Activity size={16} className="text-violet-400" /> Design Insights</h4>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <div className="bg-black/20 p-3 rounded-lg border border-white/10">
                                <div className="text-xs text-white/50 mb-1 flex items-center gap-1"><Eye size={12} /> Views</div>
                                <div className="text-xl font-bold">1,204</div>
                                <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">+12% this week</div>
                            </div>
                            <div className="bg-black/20 p-3 rounded-lg border border-white/10">
                                <div className="text-xs text-white/50 mb-1 flex items-center gap-1"><MousePointer2 size={12} /> Clicks</div>
                                <div className="text-xl font-bold">342</div>
                                <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">+5% this week</div>
                            </div>
                        </div>
                        <div className="h-24 w-full bg-white/5 rounded-lg border border-white/10 flex items-end justify-between px-4 pb-2 pt-6 relative overflow-hidden">
                            {/* Mock small bar chart */}
                            <div className="absolute top-2 left-2 text-[10px] text-white/40">Past 7 days</div>
                            {[40, 60, 45, 80, 50, 90, 70].map((h, i) => (
                                <div key={i} className="w-6 bg-violet-500/50 rounded-t-sm hover:bg-violet-400 transition-colors" style={{ height: `${h}%` }} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
