'use client';

import React from 'react';
import {
    ShoppingCart, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { DesignState, OpenMagePayload } from '@/core/types';

export interface CheckoutDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    finalPayload: OpenMagePayload | null;
    designState: DesignState;
}

export default function CheckoutDrawer({
    isOpen,
    onClose,
    finalPayload,
    designState,
}: CheckoutDrawerProps) {
    if (!isOpen || !finalPayload) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative bg-[#20202e] shadow-2xl w-[420px] h-full flex flex-col border-l border-white/10 animate-in slide-in-from-right duration-300">
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#252536]">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <ShoppingCart size={20} className="text-violet-400" /> Print Preview
                    </h2>
                    <button onClick={onClose} className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto flex flex-col">
                    <div className="bg-black/40 aspect-[4/3] flex items-center justify-center p-6 relative overflow-hidden">
                        {designState.preview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={designState.preview} alt="Preview" className="max-w-full max-h-full object-contain drop-shadow-2xl relative z-10" />
                        ) : (
                            <span className="text-white/20 text-sm">Generating preview...</span>
                        )}
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-white/50 border border-white/10 uppercase tracking-widest z-20">
                            Final Render
                        </div>
                    </div>

                    <div className="p-6 flex flex-col gap-6">
                        <div>
                            <h3 className="text-xs text-white/30 uppercase tracking-wider font-semibold mb-3">Pre-Flight Validation</h3>
                            {finalPayload.is_orderable ? (
                                <div className="bg-emerald-500/10 text-emerald-300 p-4 rounded-xl border border-emerald-500/20 flex flex-col gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-emerald-500/20 rounded-full p-1.5"><CheckCircle2 size={16} /></div>
                                        <div>
                                            <p className="font-semibold text-sm">Ready for Production</p>
                                            <p className="text-xs text-emerald-300/60 mt-0.5">Your design passes all automated quality checks.</p>
                                        </div>
                                    </div>
                                    <div className="h-px w-full bg-emerald-500/20" />
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-center text-xs font-mono text-emerald-300/80">
                                            <span>DPI &gt; 300</span>
                                            <CheckCircle2 size={12} className="text-emerald-400" />
                                        </div>
                                        <div className="flex justify-between items-center text-xs font-mono text-emerald-300/80">
                                            <span>Bleeds Safe</span>
                                            <CheckCircle2 size={12} className="text-emerald-400" />
                                        </div>
                                        <div className="flex justify-between items-center text-xs font-mono text-emerald-300/80">
                                            <span>Text Legibility</span>
                                            <CheckCircle2 size={12} className="text-emerald-400" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-red-500/10 text-red-300 p-4 rounded-xl border border-red-500/20 flex flex-col gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-red-500/20 rounded-full p-1.5"><AlertTriangle size={16} /></div>
                                        <div>
                                            <p className="font-semibold text-sm">Action Required</p>
                                            <p className="text-xs text-red-300/60 mt-0.5">Please address {designState.warnings.length} warning(s) before printing.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="text-xs text-white/30 uppercase tracking-wider font-semibold mb-3">System Contract Data</h3>
                            <div className="bg-black/30 text-emerald-400/80 p-4 rounded-xl text-[10px] font-mono border border-white/5 max-h-[160px] overflow-y-auto">
                                <pre>{JSON.stringify(finalPayload, null, 2)}</pre>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-white/5 bg-[#252536] flex flex-col gap-3">
                    <div className="flex justify-between items-end mb-2 px-1">
                        <span className="text-white/50 text-sm">Order Total</span>
                        <span className="font-bold text-2xl tracking-tight text-white">$24.00</span>
                    </div>
                    <button
                        disabled={!finalPayload.is_orderable}
                        className={`w-full py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 ${finalPayload.is_orderable ? 'hover:scale-[1.02] active:scale-[0.98] cursor-pointer' : 'opacity-50 cursor-not-allowed saturate-0'} transition-all`}
                    >
                        <ShoppingCart size={16} /> Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
}
