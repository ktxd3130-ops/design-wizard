'use client';

import { PenTool, Pen, MousePointer2 } from 'lucide-react';

interface DrawPanelProps {
    isDrawing: boolean;
    setIsDrawing: (v: boolean) => void;
    brushType: string;
    setBrushType: (v: string) => void;
    brushColor: string;
    setBrushColor: (v: string) => void;
    brushWidth: number;
    setBrushWidth: (v: number) => void;
}

export function DrawPanel({ isDrawing, setIsDrawing, brushType, setBrushType, brushColor, setBrushColor, brushWidth, setBrushWidth }: DrawPanelProps) {
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-[#252536] z-10 shrink-0 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/90">Draw</h3>
                <button
                    onClick={() => setIsDrawing(!isDrawing)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isDrawing ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25' : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'}`}
                >
                    {isDrawing ? 'Drawing Active' : 'Enable Drawing'}
                </button>
            </div>
            <div className={`flex-1 overflow-y-auto p-4 space-y-6 ${!isDrawing ? 'opacity-50 pointer-events-none' : ''} transition-opacity duration-300`}>

                {/* Brush Types */}
                <div className="space-y-3">
                    <p className="text-[11px] font-bold tracking-wider uppercase text-white/50">Pens</p>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { id: 'pen', icon: <PenTool size={20} />, label: 'Pen' },
                            { id: 'marker', icon: <Pen size={20} />, label: 'Marker' },
                            { id: 'highlighter', icon: <MousePointer2 size={20} className="rotate-90" />, label: 'Highlighter' }
                        ].map(brush => (
                            <button
                                key={brush.id}
                                onClick={() => setBrushType(brush.id)}
                                className={`h-20 rounded-xl flex flex-col items-center justify-center gap-2 border transition-all ${brushType === brush.id ? 'bg-violet-500/10 border-violet-500/50 text-violet-400' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80'}`}
                            >
                                {brush.icon}
                                <span className="text-[10px] font-medium">{brush.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Brush Color */}
                <div className="space-y-3">
                    <p className="text-[11px] font-bold tracking-wider uppercase text-white/50">Color</p>
                    <div className="grid grid-cols-5 gap-2">
                        {['#ffffff', '#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'].map(color => (
                            <button
                                key={color}
                                onClick={() => setBrushColor(color)}
                                aria-label={`Select color ${color}`}
                                title={`Use ${color}`}
                                className={`w-8 h-8 rounded-full border-2 transition-all mx-auto cursor-pointer ${brushColor === color ? 'border-violet-500 scale-110 shadow-[0_0_10px_rgba(139,92,246,0.5)]' : 'border-white/20 hover:border-white/50'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>

                {/* Brush Weight */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold tracking-wider uppercase text-white/50">Weight</p>
                        <span className="text-xs text-white/80 w-8 text-right bg-white/10 rounded px-1">{brushWidth}</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={brushWidth}
                        onChange={(e) => setBrushWidth(parseInt(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
                    />
                </div>
            </div>
        </div>
    );
}
