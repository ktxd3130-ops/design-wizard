'use client';

import { Image as ImageIcon, Type, Layers, MoreHorizontal } from 'lucide-react';
import { DesignState } from '@/core/types';

interface LayersPanelProps {
    designState: DesignState;
}

export function LayersPanel({ designState }: LayersPanelProps) {
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-[#252536] z-10 shrink-0 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/90">Layers</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {designState.objects.slice().reverse().map((layer: any, idx) => (
                    <div key={layer.id} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 cursor-pointer transition-colors group">
                        {layer.type === 'image' ? <ImageIcon size={16} className="text-blue-400" /> : layer.type === 'textbox' || layer.type === 'text' ? <Type size={16} className="text-violet-400" /> : <Layers size={16} className="text-fuchsia-400" />}
                        <span className="text-xs font-semibold text-white/80 flex-1 truncate">{layer.type === 'textbox' || layer.type === 'text' ? layer.text : layer.name || layer.type}</span>
                        <button className="text-white/30 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal size={14} />
                        </button>
                    </div>
                ))}
                {designState.objects.length === 0 && (
                    <div className="text-center py-10 opacity-50">
                        <Layers size={32} className="mx-auto mb-2 text-white/50" />
                        <p className="text-xs">No layers on canvas.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
