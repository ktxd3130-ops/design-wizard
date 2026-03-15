'use client';

import React, { useState } from 'react';
import {
    Image as ImageIcon, Type, Layers, Eye, EyeOff, Lock, Unlock,
    Trash2, GripVertical, ChevronUp, ChevronDown
} from 'lucide-react';
import { DesignState } from '@/core/types';
import { FabricCanvas } from '@/core/FabricCanvas';

interface LayersPanelProps {
    designState: DesignState;
    fabricRef: React.RefObject<FabricCanvas | null>;
}

export function LayersPanel({ designState, fabricRef }: LayersPanelProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

    const layers = designState.objects.slice().reverse();

    const getLayerIcon = (type: string) => {
        switch (type) {
            case 'image': return <ImageIcon size={14} className="text-blue-400" />;
            case 'textbox': case 'text': case 'i-text': return <Type size={14} className="text-violet-400" />;
            default: return <Layers size={14} className="text-fuchsia-400" />;
        }
    };

    const getLayerName = (layer: any) => {
        if (layer.name) return layer.name;
        if (layer.type === 'textbox' || layer.type === 'text' || layer.type === 'i-text') {
            return layer.text?.substring(0, 24) || 'Text';
        }
        if (layer.type === 'image') return 'Image';
        return layer.type || 'Element';
    };

    const handleStartRename = (layer: any) => {
        setEditingId(layer.id);
        setEditName(getLayerName(layer));
    };

    const handleFinishRename = (id: string) => {
        // Update name on fabric object
        if (fabricRef.current) {
            const obj = fabricRef.current.canvas.getObjects().find((o: any) => o.id === id);
            if (obj) {
                (obj as any).name = editName;
            }
        }
        setEditingId(null);
    };

    const handleToggleVisibility = (id: string) => {
        if (!fabricRef.current) return;
        const obj = fabricRef.current.canvas.getObjects().find((o: any) => o.id === id);
        if (obj) {
            obj.set('visible', !obj.visible);
            fabricRef.current.canvas.requestRenderAll();
        }
    };

    const handleSelectLayer = (id: string) => {
        if (!fabricRef.current) return;
        const obj = fabricRef.current.canvas.getObjects().find((o: any) => o.id === id);
        if (obj) {
            fabricRef.current.canvas.setActiveObject(obj);
            fabricRef.current.canvas.requestRenderAll();
        }
    };

    const handleMoveUp = (id: string) => {
        if (!fabricRef.current) return;
        const obj = fabricRef.current.canvas.getObjects().find((o: any) => o.id === id);
        if (obj) {
            fabricRef.current.canvas.bringObjectForward(obj);
            fabricRef.current.canvas.requestRenderAll();
        }
    };

    const handleMoveDown = (id: string) => {
        if (!fabricRef.current) return;
        const obj = fabricRef.current.canvas.getObjects().find((o: any) => o.id === id);
        if (obj) {
            fabricRef.current.canvas.sendObjectBackwards(obj);
            fabricRef.current.canvas.requestRenderAll();
        }
    };

    const handleDelete = (id: string) => {
        if (!fabricRef.current) return;
        const obj = fabricRef.current.canvas.getObjects().find((o: any) => o.id === id);
        if (obj) {
            fabricRef.current.canvas.remove(obj);
            fabricRef.current.canvas.requestRenderAll();
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[var(--ui-5)] bg-[var(--surface-2)] z-10 shrink-0 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--ui-90)]">Layers</h3>
                <span className="text-[10px] text-[var(--ui-40)]">{layers.length} layers</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {layers.map((layer: any, idx) => {
                    const isActive = layer.id === designState.activeObjectId;
                    const isHidden = layer.opacity === 0;

                    return (
                        <div
                            key={layer.id}
                            onClick={() => handleSelectLayer(layer.id)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all cursor-pointer group ${
                                isActive
                                    ? 'bg-violet-500/15 border-violet-500/30'
                                    : 'bg-white/[0.02] border-transparent hover:bg-[var(--ui-5)] hover:border-[var(--ui-5)]'
                            }`}
                        >
                            {/* Drag handle */}
                            <div className="text-white/20 group-hover:text-[var(--ui-40)] cursor-grab">
                                <GripVertical size={12} />
                            </div>

                            {/* Type icon */}
                            {getLayerIcon(layer.type)}

                            {/* Name */}
                            <div className="flex-1 min-w-0">
                                {editingId === layer.id ? (
                                    <input
                                        autoFocus
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onBlur={() => handleFinishRename(layer.id)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleFinishRename(layer.id); if (e.key === 'Escape') setEditingId(null); }}
                                        className="w-full bg-[var(--ui-10)] text-xs text-[var(--ui-90)] px-1.5 py-0.5 rounded outline-none border border-violet-500/50"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <span
                                        onDoubleClick={(e) => { e.stopPropagation(); handleStartRename(layer); }}
                                        className="text-xs text-[var(--ui-70)] truncate block"
                                    >
                                        {getLayerName(layer)}
                                    </span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleToggleVisibility(layer.id); }}
                                    className="p-1 text-[var(--ui-30)] hover:text-[var(--ui-100)] rounded transition-colors"
                                    title={isHidden ? 'Show' : 'Hide'}
                                >
                                    {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); fabricRef.current?.toggleLock(layer.id); }}
                                    className={`p-1 rounded transition-colors ${layer.locked ? 'text-red-400' : 'text-[var(--ui-30)] hover:text-[var(--ui-100)]'}`}
                                    title={layer.locked ? 'Unlock' : 'Lock'}
                                >
                                    {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleMoveUp(layer.id); }}
                                    className="p-1 text-[var(--ui-30)] hover:text-[var(--ui-100)] rounded transition-colors"
                                    title="Move Up"
                                >
                                    <ChevronUp size={12} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleMoveDown(layer.id); }}
                                    className="p-1 text-[var(--ui-30)] hover:text-[var(--ui-100)] rounded transition-colors"
                                    title="Move Down"
                                >
                                    <ChevronDown size={12} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(layer.id); }}
                                    className="p-1 text-[var(--ui-30)] hover:text-red-400 rounded transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    );
                })}
                {layers.length === 0 && (
                    <div className="text-center py-10 opacity-50">
                        <Layers size={32} className="mx-auto mb-2 text-[var(--ui-50)]" />
                        <p className="text-xs">No layers on canvas</p>
                        <p className="text-[10px] text-[var(--ui-30)] mt-1">Add elements to see them here</p>
                    </div>
                )}
            </div>
        </div>
    );
}
