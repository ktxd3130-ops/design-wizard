'use client';

import { Search, Layers } from 'lucide-react';
import { FabricCanvas } from '@/core/FabricCanvas';
import { HC_BRANDS_CATALOG } from '@/core/templates';

interface TemplatesPanelProps {
    fabricRef: React.RefObject<FabricCanvas | null>;
    templateSearchQuery: string;
    setTemplateSearchQuery: (q: string) => void;
}

export function TemplatesPanel({ fabricRef, templateSearchQuery, setTemplateSearchQuery }: TemplatesPanelProps) {
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/5 space-y-4 shrink-0 bg-[#252536] z-10 relative">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 mt-[-1px] text-white/30" />
                    <input
                        placeholder="Search HC Brands products"
                        value={templateSearchQuery}
                        onChange={(e) => setTemplateSearchQuery(e.target.value)}
                        className="w-full bg-white/10 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white/80 placeholder-white/30 focus:outline-none focus:border-violet-500/50 transition-all font-medium"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {HC_BRANDS_CATALOG.map((category, idx) => {
                    const filteredItems = category.items.filter(item =>
                        item.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
                        category.title.toLowerCase().includes(templateSearchQuery.toLowerCase())
                    );

                    if (filteredItems.length === 0) return null;

                    return (
                        <div key={idx} className="space-y-3">
                            <div className="flex items-center justify-between sticky top-0 bg-[#252536]/90 backdrop-blur py-1 z-10">
                                <p className="text-[12px] text-white/90 uppercase tracking-widest font-bold">{category.title}</p>
                                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/40">{filteredItems.length}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {filteredItems.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={async () => {
                                            fabricRef.current?.resizeWorkspace(item.width, item.height);
                                            if (item.payload) {
                                                await fabricRef.current?.injectTemplate(item.payload, item.width, item.height);
                                            }
                                            fabricRef.current?.zoomToFit();
                                        }}
                                        className="aspect-[4/3] bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 hover:border-violet-500/50 transition-all cursor-pointer flex flex-col items-center justify-center p-2 text-center group overflow-hidden relative"
                                    >
                                        {item.image ? (
                                            <div className="absolute inset-0 w-full h-full">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 mb-2 border-2 border-dashed border-white/10 group-hover:border-violet-400/50 rounded flex items-center justify-center transition-colors relative z-10">
                                                <Layers size={14} className="text-white/20 group-hover:text-violet-400/80" />
                                            </div>
                                        )}
                                        <span className="text-[10px] font-semibold text-white/90 group-hover:text-white leading-tight line-clamp-2 relative z-10 mt-auto">{item.name}</span>
                                        <span className="text-[8px] text-white/50 mt-1 font-mono tracking-wider relative z-10">{item.width}&times;{item.height}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
