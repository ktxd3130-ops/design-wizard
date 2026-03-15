'use client';

import { Search, Clock, Sparkles, Sticker, Image as ImageIcon } from 'lucide-react';
import { FabricCanvas } from '@/core/FabricCanvas';
import { BrandConfig } from '@/core/config';

interface ElementsPanelProps {
    fabricRef: React.RefObject<FabricCanvas | null>;
    brandConfig: BrandConfig | null;
}

export function ElementsPanel({ fabricRef, brandConfig }: ElementsPanelProps) {
    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="relative sticky top-0 z-10 bg-[var(--surface-2)] pb-2">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 mt-[-4px] text-[var(--ui-30)]" />
                <input placeholder="Search elements" className="w-full bg-[var(--ui-10)] border border-[var(--ui-10)] rounded-lg pl-10 pr-3 py-2.5 text-sm text-[var(--ui-80)] placeholder-white/30 focus:outline-none focus:border-violet-500/50 transition-all" />
            </div>

            {/* Recently Used */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-[11px] text-[var(--ui-80)] uppercase tracking-wider font-semibold flex items-center gap-1"><Clock size={12} /> Recently used</p>
                    <button className="text-[11px] font-semibold text-[var(--ui-40)] hover:text-[var(--ui-100)] transition-colors cursor-pointer">See all</button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {['\u25A1', '\u25CB', '\u25B3'].map((s, i) => (
                        <div key={i} className="shrink-0 w-16 h-16 bg-[var(--ui-5)] hover:bg-[var(--ui-10)] rounded-lg border border-[var(--ui-5)] flex items-center justify-center text-2xl text-[var(--ui-40)] transition-colors cursor-pointer">{s}</div>
                    ))}
                </div>
            </div>

            {/* Shapes & Lines */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-[11px] text-[var(--ui-80)] uppercase tracking-wider font-semibold">Shapes & Lines</p>
                    <button className="text-[11px] font-semibold text-[var(--ui-40)] hover:text-[var(--ui-100)] transition-colors cursor-pointer">See all</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <button draggable onDragStart={(e) => { e.dataTransfer.setData('application/design-wizard-type', 'shape'); e.dataTransfer.setData('application/design-wizard-data', 'rect'); e.dataTransfer.effectAllowed = 'copy'; }} onClick={() => fabricRef.current?.addShape('rect', brandConfig?.colors.primary)} className="aspect-square bg-[var(--ui-5)] hover:bg-[var(--ui-10)] rounded-lg border border-[var(--ui-5)] flex items-center justify-center text-2xl text-[var(--ui-40)] hover:text-[var(--ui-70)] transition-all cursor-grab active:cursor-grabbing">{'\u25A1'}</button>
                    <button draggable onDragStart={(e) => { e.dataTransfer.setData('application/design-wizard-type', 'shape'); e.dataTransfer.setData('application/design-wizard-data', 'circle'); e.dataTransfer.effectAllowed = 'copy'; }} onClick={() => fabricRef.current?.addShape('circle', brandConfig?.colors.primary)} className="aspect-square bg-[var(--ui-5)] hover:bg-[var(--ui-10)] rounded-lg border border-[var(--ui-5)] flex items-center justify-center text-2xl text-[var(--ui-40)] hover:text-[var(--ui-70)] transition-all cursor-grab active:cursor-grabbing">{'\u25CB'}</button>
                    <button draggable onDragStart={(e) => { e.dataTransfer.setData('application/design-wizard-type', 'shape'); e.dataTransfer.setData('application/design-wizard-data', 'triangle'); e.dataTransfer.effectAllowed = 'copy'; }} onClick={() => fabricRef.current?.addShape('triangle', brandConfig?.colors.primary)} className="aspect-square bg-[var(--ui-5)] hover:bg-[var(--ui-10)] rounded-lg border border-[var(--ui-5)] flex items-center justify-center text-2xl text-[var(--ui-40)] hover:text-[var(--ui-70)] transition-all cursor-grab active:cursor-grabbing">{'\u25B3'}</button>
                    <button draggable onDragStart={(e) => { e.dataTransfer.setData('application/design-wizard-type', 'shape'); e.dataTransfer.setData('application/design-wizard-data', 'star'); e.dataTransfer.effectAllowed = 'copy'; }} onClick={() => fabricRef.current?.addShape('star', brandConfig?.colors.primary)} className="aspect-square bg-[var(--ui-5)] hover:bg-[var(--ui-10)] rounded-lg border border-[var(--ui-5)] flex items-center justify-center text-2xl text-[var(--ui-40)] hover:text-[var(--ui-70)] transition-all cursor-grab active:cursor-grabbing">{'\u2606'}</button>
                    <button draggable onDragStart={(e) => { e.dataTransfer.setData('application/design-wizard-type', 'shape'); e.dataTransfer.setData('application/design-wizard-data', 'hex'); e.dataTransfer.effectAllowed = 'copy'; }} onClick={() => fabricRef.current?.addShape('hex', brandConfig?.colors.primary)} className="aspect-square bg-[var(--ui-5)] hover:bg-[var(--ui-10)] rounded-lg border border-[var(--ui-5)] flex items-center justify-center text-2xl text-[var(--ui-40)] hover:text-[var(--ui-70)] transition-all cursor-grab active:cursor-grabbing">{'\u2B21'}</button>
                    <button draggable onDragStart={(e) => { e.dataTransfer.setData('application/design-wizard-type', 'shape'); e.dataTransfer.setData('application/design-wizard-data', 'diamond'); e.dataTransfer.effectAllowed = 'copy'; }} onClick={() => fabricRef.current?.addShape('diamond', brandConfig?.colors.primary)} className="aspect-square bg-[var(--ui-5)] hover:bg-[var(--ui-10)] rounded-lg border border-[var(--ui-5)] flex items-center justify-center text-2xl text-[var(--ui-40)] hover:text-[var(--ui-70)] transition-all cursor-grab active:cursor-grabbing">{'\u25C7'}</button>
                </div>
            </div>

            {/* Graphics */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-[11px] text-[var(--ui-80)] uppercase tracking-wider font-semibold flex items-center gap-1"><Sparkles size={12} /> Graphics</p>
                    <button className="text-[11px] font-semibold text-[var(--ui-40)] hover:text-[var(--ui-100)] transition-colors cursor-pointer">See all</button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&q=80', 'https://images.unsplash.com/photo-1557683316-973673baf926?w=200&q=80', 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80', 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=200&q=80'].map((src, i) => (
                        <div key={i} draggable onDragStart={(e) => { e.dataTransfer.setData('application/design-wizard-type', 'image'); e.dataTransfer.setData('application/design-wizard-data', src); e.dataTransfer.effectAllowed = 'copy'; }} className="shrink-0 w-20 h-20 rounded-lg border border-[var(--ui-5)] overflow-hidden transition-all cursor-grab active:cursor-grabbing group hover:border-violet-500/50 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="Graphic" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Stickers */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-[11px] text-[var(--ui-80)] uppercase tracking-wider font-semibold flex items-center gap-1"><Sticker size={12} /> Stickers</p>
                    <button className="text-[11px] font-semibold text-[var(--ui-40)] hover:text-[var(--ui-100)] transition-colors cursor-pointer">See all</button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {['https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=200&q=80', 'https://images.unsplash.com/photo-1496667107775-680076a5b282?w=200&q=80', 'https://images.unsplash.com/photo-1554629947-334ff61d85dc?w=200&q=80', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80'].map((src, i) => (
                        <div key={i} draggable onDragStart={(e) => { e.dataTransfer.setData('application/design-wizard-type', 'image'); e.dataTransfer.setData('application/design-wizard-data', src); e.dataTransfer.effectAllowed = 'copy'; }} className="shrink-0 w-20 h-20 rounded-full border border-[var(--ui-5)] overflow-hidden transition-all cursor-grab active:cursor-grabbing group hover:border-violet-500/50 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="Sticker" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Photos */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-[11px] text-[var(--ui-80)] uppercase tracking-wider font-semibold flex items-center gap-1"><ImageIcon size={12} /> Photos</p>
                    <button className="text-[11px] font-semibold text-[var(--ui-40)] hover:text-[var(--ui-100)] transition-colors cursor-pointer">See all</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {['https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&q=80', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80'].map((src, i) => (
                        <div key={i} draggable onDragStart={(e) => { e.dataTransfer.setData('application/design-wizard-type', 'image'); e.dataTransfer.setData('application/design-wizard-data', src); e.dataTransfer.effectAllowed = 'copy'; }} className="aspect-[4/3] rounded-lg border border-[var(--ui-5)] overflow-hidden transition-all cursor-grab active:cursor-grabbing group hover:border-violet-500/50 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="Photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
