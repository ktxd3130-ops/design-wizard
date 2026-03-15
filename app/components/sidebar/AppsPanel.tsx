'use client';

import { Search, Wand2, Sparkles, Loader2 } from 'lucide-react';
import { FabricCanvas } from '@/core/FabricCanvas';

interface AppsPanelProps {
    fabricRef: React.RefObject<FabricCanvas | null>;
    genFillPrompt: string;
    setGenFillPrompt: (v: string) => void;
    isGenFillActive: boolean;
    onGenFill: () => void;
}

export function AppsPanel({ fabricRef, genFillPrompt, setGenFillPrompt, isGenFillActive, onGenFill }: AppsPanelProps) {
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[var(--ui-5)] bg-[var(--surface-2)] z-10 shrink-0">
                <h3 className="text-sm font-semibold text-[var(--ui-90)] mb-3">Discover apps</h3>
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 mt-[-1px] text-[var(--ui-30)]" />
                    <input placeholder="Search apps" className="w-full bg-[var(--ui-10)] border border-[var(--ui-10)] rounded-lg pl-10 pr-3 py-2.5 text-sm text-[var(--ui-80)] placeholder-white/30 focus:outline-none focus:border-violet-500/50 transition-all font-medium" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="space-y-4">
                    <div className="bg-[var(--ui-5)] border border-[var(--ui-10)] rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                                <Wand2 size={16} className="text-white" />
                            </div>
                            <h4 className="text-sm font-bold text-[var(--ui-100)]">Generative Fill</h4>
                        </div>
                        <p className="text-xs text-[var(--ui-60)] mb-3">Describe what you want to add to the canvas.</p>
                        <textarea
                            value={genFillPrompt}
                            onChange={(e) => setGenFillPrompt(e.target.value)}
                            placeholder="E.g. A realistic red apple..."
                            className="w-full bg-black/20 border border-[var(--ui-10)] rounded-lg p-2 text-sm text-[var(--ui-100)] placeholder-white/30 resize-none h-20 focus:outline-none focus:border-violet-500 mb-3"
                        />
                        <button
                            onClick={onGenFill}
                            disabled={isGenFillActive || !genFillPrompt.trim()}
                            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:hover:bg-violet-600 text-[var(--ui-100)] font-medium py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isGenFillActive ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            Generate
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
