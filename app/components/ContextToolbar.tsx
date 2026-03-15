'use client';

import React from 'react';
import {
    AlertTriangle, Loader2,
    Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
    Minus, Plus, Sparkles, Layers, ChevronDown, Crop,
    FlipHorizontal2, FlipVertical2, SlidersHorizontal
} from 'lucide-react';
import { FabricCanvas } from '@/core/FabricCanvas';
import { BrandConfig } from '@/core/config';
import { DesignState } from '@/core/types';
import { GOOGLE_FONTS } from '@/core/GoogleFonts';

export interface ContextToolbarProps {
    fabricRef: React.RefObject<FabricCanvas | null>;
    designState: DesignState;
    brandConfig: BrandConfig | null;
    isAdmin: boolean;
    isRemovingBg: boolean;
    onRemoveBg: () => void;
    activePanel: string | null;
    setActivePanel: (panel: any) => void;
}

export default function ContextToolbar({
    fabricRef,
    designState,
    brandConfig,
    isAdmin,
    isRemovingBg,
    onRemoveBg,
    activePanel,
    setActivePanel,
}: ContextToolbarProps) {
    const activeObj = designState.objects.find(o => o.id === designState.activeObjectId) as any;
    const isTextSelected = activeObj && ['textbox', 'text', 'i-text'].includes(activeObj.type);
    const isShapeSelected = activeObj && ['rect', 'circle', 'triangle', 'polygon', 'path'].includes(activeObj.type);
    const isImageSelected = activeObj && activeObj.type === 'image';

    return (
        <div className="h-[48px] bg-[var(--surface-3)] border-b border-[var(--ui-5)] flex items-center px-5 gap-2.5 shrink-0">
            {isTextSelected ? (
                <>
                    {/* Font family restricted by Brand Kit */}
                    <div className="relative group/font">
                        <button className="flex items-center justify-between gap-2 bg-[var(--ui-10)] hover:bg-[var(--ui-15)] px-3 py-1.5 rounded-lg text-sm text-[var(--ui-90)] min-w-[140px] transition-colors cursor-pointer" aria-label="Font Family" title="Font Family">
                            <span>{activeObj.fontFamily || 'Sans Serif'}</span> <ChevronDown size={12} className="text-[var(--ui-40)] group-hover/font:rotate-180 transition-transform" />
                        </button>
                        <div className="absolute top-full left-0 mt-1 w-[180px] max-h-[300px] overflow-y-auto bg-[var(--surface-3)] border border-[var(--ui-10)] rounded-lg shadow-xl opacity-0 invisible group-hover/font:opacity-100 group-hover/font:visible transition-all z-50 flex flex-col">
                            {(!isAdmin && brandConfig?.typography.fonts) ? (
                                brandConfig.typography.fonts.map(font => (
                                    <button key={font} onClick={() => fabricRef.current?.updateFontFamily(font)} className="text-left px-3 py-2 text-sm text-[var(--ui-80)] hover:bg-[var(--ui-10)] hover:text-[var(--ui-100)] transition-colors font-medium" style={{ fontFamily: font }}>
                                        {font} <span className="text-[10px] text-violet-400 ml-1 rounded-sm bg-violet-400/10 px-1 py-0.5">Brand</span>
                                    </button>
                                ))
                            ) : (
                                GOOGLE_FONTS.slice(0, 20).map(font => (
                                    <button key={font} onClick={() => fabricRef.current?.updateFontFamily(font)} className="text-left px-3 py-2 text-sm text-[var(--ui-80)] hover:bg-[var(--ui-10)] hover:text-[var(--ui-100)] transition-colors" style={{ fontFamily: font }}>
                                        {font}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                    {/* Font size */}
                    <div className="flex items-center bg-[var(--ui-10)] rounded-lg overflow-hidden" aria-label="Font Size">
                        <button onClick={() => fabricRef.current?.updateActiveObjectProperty('fontSize', Math.max(8, (activeObj.fontSize || 24) - 2))} className="px-2 py-1.5 text-[var(--ui-50)] hover:text-[var(--ui-100)] hover:bg-[var(--ui-10)] transition-colors" aria-label="Decrease Font Size" title="Decrease Font Size"><Minus size={14} /></button>
                        <span className="text-sm text-[var(--ui-90)] px-2 min-w-[32px] text-center">{Math.round(activeObj.fontSize || 24)}</span>
                        <button onClick={() => fabricRef.current?.updateActiveObjectProperty('fontSize', (activeObj.fontSize || 24) + 2)} className="px-2 py-1.5 text-[var(--ui-50)] hover:text-[var(--ui-100)] hover:bg-[var(--ui-10)] transition-colors" aria-label="Increase Font Size" title="Increase Font Size"><Plus size={14} /></button>
                    </div>
                    <div className="w-px h-6 bg-[var(--ui-10)] mx-1.5" />
                    {/* Color */}
                    <label className="w-7 h-7 rounded-lg border-2 border-[var(--ui-20)] hover:border-[var(--ui-40)] transition-colors cursor-pointer block relative overflow-hidden" style={{ backgroundColor: (activeObj.fill as string) || '#000' }} title="Text Color" aria-label="Text Color">
                        <input type="color" className="absolute opacity-0 w-full h-full cursor-pointer inset-0 default-color-picker" value={(activeObj.fill as string) || '#000000'} onChange={(e) => fabricRef.current?.updateActiveObjectProperty('fill', e.target.value)} />
                    </label>
                    <div className="w-px h-6 bg-[var(--ui-10)] mx-1.5" />
                    {/* B I U */}
                    <button onClick={() => fabricRef.current?.toggleActiveObjectProperty('fontWeight', 'bold', 'normal')} className={`p-1.5 rounded-md transition-colors cursor-pointer ${activeObj.fontWeight === 'bold' ? 'bg-[var(--ui-20)] text-[var(--ui-100)]' : 'text-[var(--ui-50)] hover:text-[var(--ui-100)] hover:bg-[var(--ui-10)]'}`} aria-label="Bold" title="Bold"><Bold size={16} /></button>
                    <button onClick={() => fabricRef.current?.toggleActiveObjectProperty('fontStyle', 'italic', 'normal')} className={`p-1.5 rounded-md transition-colors cursor-pointer ${activeObj.fontStyle === 'italic' ? 'bg-[var(--ui-20)] text-[var(--ui-100)]' : 'text-[var(--ui-50)] hover:text-[var(--ui-100)] hover:bg-[var(--ui-10)]'}`} aria-label="Italic" title="Italic"><Italic size={16} /></button>
                    <button onClick={() => fabricRef.current?.toggleActiveObjectProperty('underline', true, false)} className={`p-1.5 rounded-md transition-colors cursor-pointer ${activeObj.underline ? 'bg-[var(--ui-20)] text-[var(--ui-100)]' : 'text-[var(--ui-50)] hover:text-[var(--ui-100)] hover:bg-[var(--ui-10)]'}`} aria-label="Underline" title="Underline"><Underline size={16} /></button>
                    <div className="w-px h-6 bg-[var(--ui-10)] mx-1.5" />
                    {/* Alignment */}
                    <button onClick={() => fabricRef.current?.updateActiveObjectProperty('textAlign', 'left')} className={`p-1.5 rounded-md transition-colors cursor-pointer ${activeObj.textAlign === 'left' ? 'bg-[var(--ui-20)] text-[var(--ui-100)]' : 'text-[var(--ui-50)] hover:text-[var(--ui-100)] hover:bg-[var(--ui-10)]'}`} aria-label="Align Left" title="Align Left"><AlignLeft size={16} /></button>
                    <button onClick={() => fabricRef.current?.updateActiveObjectProperty('textAlign', 'center')} className={`p-1.5 rounded-md transition-colors cursor-pointer ${activeObj.textAlign === 'center' || !activeObj.textAlign ? 'bg-[var(--ui-20)] text-[var(--ui-100)]' : 'text-[var(--ui-50)] hover:text-[var(--ui-100)] hover:bg-[var(--ui-10)]'}`} aria-label="Align Center" title="Align Center"><AlignCenter size={16} /></button>
                    <button onClick={() => fabricRef.current?.updateActiveObjectProperty('textAlign', 'right')} className={`p-1.5 rounded-md transition-colors cursor-pointer ${activeObj.textAlign === 'right' ? 'bg-[var(--ui-20)] text-[var(--ui-100)]' : 'text-[var(--ui-50)] hover:text-[var(--ui-100)] hover:bg-[var(--ui-10)]'}`} aria-label="Align Right" title="Align Right"><AlignRight size={16} /></button>
                    <div className="w-px h-6 bg-[var(--ui-10)] mx-1.5" />
                    {/* Text Effects: Stroke & Shadow */}
                    <div className="flex items-center gap-2 group relative">
                        <button className="text-sm text-[var(--ui-60)] hover:text-[var(--ui-100)] hover:bg-[var(--ui-10)] px-3 py-1.5 rounded-md transition-colors cursor-pointer">Effects</button>
                        <div className="absolute top-full left-0 mt-2 p-3 w-64 bg-[var(--surface-3)] border border-[var(--ui-10)] rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                            {/* Stroke */}
                            <div className="mb-4">
                                <div className="text-xs font-semibold text-[var(--ui-70)] mb-2">Outline (Stroke)</div>
                                <div className="flex items-center gap-3">
                                    <label className="w-6 h-6 rounded-full border-2 border-[var(--ui-20)] hover:border-[var(--ui-40)] transition-colors cursor-pointer block relative overflow-hidden" style={{ backgroundColor: (activeObj.stroke as string) || 'transparent' }}>
                                        <input type="color" className="absolute opacity-0 w-full h-full cursor-pointer inset-0" value={(activeObj.stroke as string) || '#000000'} onChange={(e) => fabricRef.current?.updateActiveObjectProperty('stroke', e.target.value)} />
                                    </label>
                                    <input type="range" className="flex-1 accent-violet-500 cursor-pointer" min="0" max="10" step="0.5" value={activeObj.strokeWidth || 0} onChange={(e) => fabricRef.current?.updateActiveObjectProperty('strokeWidth', parseFloat(e.target.value))} />
                                    <span className="text-xs text-[var(--ui-50)] w-6">{activeObj.strokeWidth || 0}</span>
                                </div>
                            </div>
                            {/* Shadow */}
                            <div>
                                <div className="text-xs font-semibold text-[var(--ui-70)] mb-2">Drop Shadow</div>
                                <div className="flex items-center gap-3 mb-2">
                                    <label className="w-6 h-6 rounded-full border-2 border-[var(--ui-20)] hover:border-[var(--ui-40)] transition-colors cursor-pointer block relative overflow-hidden" style={{ backgroundColor: activeObj.shadow?.color || 'transparent' }}>
                                        <input type="color" className="absolute opacity-0 w-full h-full cursor-pointer inset-0" value={activeObj.shadow?.color || '#000000'} onChange={(e) => {
                                            const currentShadow = activeObj.shadow || { blur: 10, offsetX: 5, offsetY: 5 };
                                            fabricRef.current?.updateActiveObjectProperty('shadow', { ...currentShadow, color: e.target.value });
                                        }} />
                                    </label>
                                    <span className="text-[10px] text-[var(--ui-50)]">Color</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-[var(--ui-50)] w-10">Blur</span>
                                        <input type="range" className="flex-1 accent-violet-500 cursor-pointer h-1" min="0" max="50" value={activeObj.shadow?.blur || 0} onChange={(e) => {
                                            const currentShadow = activeObj.shadow || { color: '#000000', offsetX: 5, offsetY: 5 };
                                            fabricRef.current?.updateActiveObjectProperty('shadow', { ...currentShadow, blur: parseInt(e.target.value) });
                                        }} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-[var(--ui-50)] w-10">Offset X</span>
                                        <input type="range" className="flex-1 accent-violet-500 cursor-pointer h-1" min="-50" max="50" value={activeObj.shadow?.offsetX || 0} onChange={(e) => {
                                            const currentShadow = activeObj.shadow || { color: '#000000', blur: 10, offsetY: 5 };
                                            fabricRef.current?.updateActiveObjectProperty('shadow', { ...currentShadow, offsetX: parseInt(e.target.value) });
                                        }} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-[var(--ui-50)] w-10">Offset Y</span>
                                        <input type="range" className="flex-1 accent-violet-500 cursor-pointer h-1" min="-50" max="50" value={activeObj.shadow?.offsetY || 0} onChange={(e) => {
                                            const currentShadow = activeObj.shadow || { color: '#000000', blur: 10, offsetX: 5 };
                                            fabricRef.current?.updateActiveObjectProperty('shadow', { ...currentShadow, offsetY: parseInt(e.target.value) });
                                        }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : isShapeSelected ? (
                <>
                    <label className="w-7 h-7 rounded-lg border-2 border-[var(--ui-20)] hover:border-[var(--ui-40)] transition-colors cursor-pointer block relative overflow-hidden" style={{ backgroundColor: (activeObj.fill as string) || '#000' }} title="Shape Fill Color" aria-label="Shape Fill Color">
                        <input type="color" className="absolute opacity-0 w-full h-full cursor-pointer inset-0 default-color-picker" value={(activeObj.fill as string) || '#000000'} onChange={(e) => fabricRef.current?.updateActiveObjectProperty('fill', e.target.value)} />
                    </label>
                    <div className="w-px h-6 bg-[var(--ui-10)] mx-1.5" />
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--ui-50)]">Stroke</span>
                        <label className="w-6 h-6 rounded-full border-2 border-[var(--ui-20)] hover:border-[var(--ui-40)] transition-colors cursor-pointer block relative overflow-hidden" style={{ backgroundColor: (activeObj.stroke as string) || 'transparent' }} title="Stroke Color" aria-label="Stroke Color">
                            <input type="color" className="absolute opacity-0 w-full h-full cursor-pointer inset-0 default-color-picker" value={(activeObj.stroke as string) || '#000000'} onChange={(e) => fabricRef.current?.updateActiveObjectProperty('stroke', e.target.value)} />
                        </label>
                        <input type="range" className="w-16 accent-white cursor-pointer" min="0" max="20" value={activeObj.strokeWidth || 0} onChange={(e) => fabricRef.current?.updateActiveObjectProperty('strokeWidth', parseInt(e.target.value))} aria-label="Stroke Width" title="Stroke Width" />
                    </div>
                </>
            ) : isImageSelected ? (
                <>
                    <button onClick={onRemoveBg} disabled={isRemovingBg} className="flex items-center gap-1.5 text-sm bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 px-3 py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50">
                        {isRemovingBg ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} AI Remove BG
                    </button>
                    <div className="w-px h-6 bg-[var(--ui-10)] mx-1.5" />
                    {/* Flip */}
                    <button onClick={() => fabricRef.current?.flipHorizontal()} className="flex items-center gap-1.5 text-sm text-[var(--ui-60)] hover:text-[var(--ui-100)] hover:bg-[var(--ui-10)] px-3 py-1.5 rounded-md transition-colors cursor-pointer" title="Flip Horizontal">
                        <FlipHorizontal2 size={14} /> Flip
                    </button>
                    <button onClick={() => fabricRef.current?.flipVertical()} className="p-1.5 text-[var(--ui-50)] hover:text-[var(--ui-100)] hover:bg-[var(--ui-10)] rounded-md transition-colors cursor-pointer" title="Flip Vertical">
                        <FlipVertical2 size={14} />
                    </button>
                    <div className="w-px h-6 bg-[var(--ui-10)] mx-1.5" />
                    {/* Opacity */}
                    <div className="flex items-center gap-2">
                        <Layers size={14} className="text-[var(--ui-50)]" />
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={Math.round((activeObj.opacity ?? 1) * 100)}
                            onChange={(e) => fabricRef.current?.setOpacity(parseInt(e.target.value))}
                            className="w-20 accent-violet-500 cursor-pointer"
                            title="Opacity"
                        />
                        <span className="text-xs text-[var(--ui-50)] w-8">{Math.round((activeObj.opacity ?? 1) * 100)}%</span>
                    </div>
                    <div className="w-px h-6 bg-[var(--ui-10)] mx-1.5" />
                    {/* Filters dropdown */}
                    <div className="relative group/filters">
                        <button className="flex items-center gap-1.5 text-sm text-[var(--ui-60)] hover:text-[var(--ui-100)] hover:bg-[var(--ui-10)] px-3 py-1.5 rounded-md transition-colors cursor-pointer">
                            <SlidersHorizontal size={14} /> Filters
                        </button>
                        <div className="absolute top-full left-0 mt-2 p-4 w-[240px] bg-[var(--surface-3)] border border-[var(--ui-10)] rounded-xl shadow-2xl opacity-0 invisible group-hover/filters:opacity-100 group-hover/filters:visible transition-all z-50 space-y-3">
                            <div className="text-xs font-semibold text-[var(--ui-70)] mb-3">Image Adjustments</div>
                            {[
                                { label: 'Brightness', type: 'Brightness', min: -100, max: 100 },
                                { label: 'Contrast', type: 'Contrast', min: -100, max: 100 },
                                { label: 'Saturation', type: 'Saturation', min: -100, max: 100 },
                                { label: 'Blur', type: 'Blur', min: 0, max: 100 },
                            ].map(filter => (
                                <div key={filter.type} className="flex items-center gap-2">
                                    <span className="text-[10px] text-[var(--ui-50)] w-16">{filter.label}</span>
                                    <input
                                        type="range"
                                        min={filter.min}
                                        max={filter.max}
                                        defaultValue="0"
                                        onChange={(e) => fabricRef.current?.applyImageFilter(filter.type, parseInt(e.target.value))}
                                        className="flex-1 accent-violet-500 cursor-pointer h-1"
                                    />
                                </div>
                            ))}
                            <div className="h-px bg-[var(--ui-10)] my-2" />
                            <div className="text-xs font-semibold text-[var(--ui-70)] mb-2">Presets</div>
                            <div className="grid grid-cols-3 gap-1.5">
                                {[
                                    { label: 'B&W', action: () => fabricRef.current?.applyImageFilter('Grayscale', 1) },
                                    { label: 'Sepia', action: () => fabricRef.current?.applyImageFilter('Sepia', 1) },
                                    { label: 'Invert', action: () => fabricRef.current?.applyImageFilter('Invert', 1) },
                                ].map(preset => (
                                    <button key={preset.label} onClick={preset.action} className="px-2 py-1.5 bg-[var(--ui-5)] hover:bg-[var(--ui-10)] rounded text-[10px] text-[var(--ui-60)] hover:text-[var(--ui-100)] transition-colors">
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => fabricRef.current?.resetImageFilters()}
                                className="w-full mt-2 text-xs text-[var(--ui-40)] hover:text-[var(--ui-100)] py-1.5 rounded hover:bg-[var(--ui-5)] transition-colors"
                            >
                                Reset All
                            </button>
                        </div>
                    </div>
                </>
            ) : activeObj ? (
                <span className="text-xs text-[var(--ui-70)]">Element selected</span>
            ) : (
                <span className="text-xs text-[var(--ui-30)] hidden md:inline">Select an element to edit its properties</span>
            )}

            {/* Right side: panel tabs + warnings */}
            <div className="ml-auto flex items-center gap-2">
                {activeObj && (
                    <>
                        <div className="w-px h-6 bg-[var(--ui-10)] mx-1.5" />
                        <button
                            onClick={() => setActivePanel(activePanel === 'position' ? null : 'position')}
                            className={`text-sm px-3 py-1 rounded-full transition-colors cursor-pointer ${activePanel === 'position' ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40' : 'text-[var(--ui-60)] hover:text-[var(--ui-100)] hover:bg-[var(--ui-10)]'}`}
                        >
                            Position
                        </button>
                    </>
                )}
                {designState.warnings.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-red-500/20 text-red-300 px-3 py-1 rounded-lg text-xs font-medium border border-red-500/30">
                        <AlertTriangle size={12} /> {designState.warnings.length} Warning{designState.warnings.length > 1 ? 's' : ''}
                    </div>
                )}
            </div>
        </div>
    );
}
