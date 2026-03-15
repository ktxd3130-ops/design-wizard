'use client';

import { Search, Type, Wand2, Sparkles } from 'lucide-react';
import { FabricCanvas } from '@/core/FabricCanvas';

interface TextPanelProps {
    fabricRef: React.RefObject<FabricCanvas | null>;
}

export function TextPanel({ fabricRef }: TextPanelProps) {
    const handleAddText = (textStr: string = 'Your text here', options: { fontSize?: number; fontWeight?: string | number } = {}) => {
        fabricRef.current?.addText(textStr, options);
    };

    return (
        <div className="flex-1 overflow-y-auto">
            {/* Search + Actions */}
            <div className="p-6 space-y-5">
                <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ui-30)]" />
                    <input placeholder="Search fonts and combinations" className="w-full bg-[var(--ui-10)] border border-[var(--ui-10)] rounded-xl pl-11 pr-4 py-3.5 text-sm text-[var(--ui-80)] placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all" />
                </div>

                <button draggable onDragStart={(e) => { e.dataTransfer.setData('application/design-wizard-type', 'text'); e.dataTransfer.setData('application/design-wizard-data', 'Your text here'); e.dataTransfer.effectAllowed = 'copy'; }} onClick={() => handleAddText()} className="w-full flex items-center justify-center gap-2.5 bg-violet-600 hover:bg-violet-500 text-[var(--ui-100)] py-4 rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-violet-500/20 cursor-grab active:cursor-grabbing">
                    <Type size={18} /> Add a text box
                </button>

                <button className="w-full flex items-center justify-center gap-2.5 bg-[var(--ui-5)] hover:bg-[var(--ui-10)] border border-[var(--ui-10)] text-[var(--ui-100)] py-4 rounded-xl font-medium text-sm transition-colors cursor-pointer">
                    <Wand2 size={16} className="text-violet-400" /> Magic Write
                </button>
            </div>

            {/* Default text styles */}
            <div className="p-6 border-t border-[var(--ui-10)]">
                <p className="text-[11px] text-[var(--ui-40)] uppercase tracking-wider font-semibold mb-5">Default text styles</p>
                <div className="space-y-4">
                    <button draggable onDragStart={(e) => { e.dataTransfer.setData('application/design-wizard-type', 'text'); e.dataTransfer.setData('application/design-wizard-data', 'Heading'); e.dataTransfer.effectAllowed = 'copy'; }} onClick={() => handleAddText('Heading', { fontSize: 48, fontWeight: 'bold' })} className="w-full text-left px-6 py-5 bg-white text-black hover:bg-gray-100 rounded-xl border border-transparent hover:border-violet-500 transition-all cursor-grab active:cursor-grabbing shadow-sm">
                        <span className="text-lg font-bold">Add a heading</span>
                    </button>
                    <button draggable onDragStart={(e) => { e.dataTransfer.setData('application/design-wizard-type', 'text'); e.dataTransfer.setData('application/design-wizard-data', 'Subheading'); e.dataTransfer.effectAllowed = 'copy'; }} onClick={() => handleAddText('Subheading', { fontSize: 32, fontWeight: 600 })} className="w-full text-left px-6 py-5 bg-white text-black hover:bg-gray-100 rounded-xl border border-transparent hover:border-violet-500 transition-all cursor-grab active:cursor-grabbing shadow-sm">
                        <span className="text-sm font-semibold">Add a subheading</span>
                    </button>
                    <button draggable onDragStart={(e) => { e.dataTransfer.setData('application/design-wizard-type', 'text'); e.dataTransfer.setData('application/design-wizard-data', 'Body text'); e.dataTransfer.effectAllowed = 'copy'; }} onClick={() => handleAddText('Body text', { fontSize: 24, fontWeight: 'normal' })} className="w-full text-left px-6 py-5 bg-white text-black hover:bg-gray-100 rounded-xl border border-transparent hover:border-violet-500 transition-all cursor-grab active:cursor-grabbing shadow-sm">
                        <span className="text-xs">Add a little bit of body text</span>
                    </button>
                </div>
            </div>

            {/* Dynamic text */}
            <div className="p-6 border-t border-[var(--ui-10)]">
                <p className="text-[11px] text-[var(--ui-40)] uppercase tracking-wider font-semibold mb-5">Dynamic text</p>
                <button className="w-full flex items-center gap-4 px-5 py-5 bg-[var(--ui-5)] hover:bg-[var(--ui-10)] rounded-xl border border-[var(--ui-5)] transition-colors cursor-pointer group">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-amber-500 rounded-lg flex items-center justify-center text-[var(--ui-90)] text-xs font-bold ring-1 ring-white/10">
                        [1]
                    </div>
                    <span className="text-sm font-semibold text-[var(--ui-90)] group-hover:text-[var(--ui-100)]">Page numbers</span>
                </button>
            </div>

            {/* Apps */}
            <div className="p-6 border-t border-[var(--ui-10)]">
                <div className="flex items-center justify-between mb-5">
                    <p className="text-[11px] text-[var(--ui-40)] uppercase tracking-wider font-semibold">Apps</p>
                    <button className="text-[10px] text-[var(--ui-50)] hover:text-[var(--ui-100)] font-medium">See all</button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="aspect-square bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-xl border border-[var(--ui-10)] flex items-center justify-center cursor-pointer hover:border-[var(--ui-30)] transition-colors">
                            <Sparkles size={16} className="text-[var(--ui-40)]" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Font combinations */}
            <div className="p-6 border-t border-[var(--ui-10)]">
                <p className="text-[11px] text-[var(--ui-40)] uppercase tracking-wider font-semibold mb-5">Font combinations</p>
                <div className="space-y-4">
                    {[
                        { title: 'Impact', sub: 'Bold & Industrial', ff: 'impact' },
                        { title: 'Georgia', sub: 'Classic & Elegant', ff: 'georgia' },
                        { title: 'Courier', sub: 'Monospace Code', ff: 'courier' },
                        { title: 'Verdana', sub: 'Clean & Modern', ff: 'verdana' },
                    ].map(f => (
                        <button key={f.ff} draggable onDragStart={(e) => { e.dataTransfer.setData('application/design-wizard-type', 'text'); e.dataTransfer.setData('application/design-wizard-data', f.title); e.dataTransfer.effectAllowed = 'copy'; }} onClick={() => fabricRef.current?.updateFontFamily(f.ff)} className="w-full text-left px-6 py-5 bg-[var(--ui-5)] hover:bg-[var(--ui-10)] rounded-xl border border-[var(--ui-5)] transition-colors cursor-grab active:cursor-grabbing group">
                            <span className="text-base font-bold text-[var(--ui-80)] group-hover:text-[var(--ui-100)]" style={{ fontFamily: f.ff }}>{f.title}</span>
                            <span className="block text-[11px] text-[var(--ui-30)] mt-1.5">{f.sub}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
