'use client';

import { useEffect, useRef, useState } from 'react';
import { FabricCanvas } from '@/core/FabricCanvas';
import { useDesignStore } from '@/core/storage';
import { Plus, Type, Image as ImageIcon, AlertTriangle, UploadCloud, Loader2, ShoppingCart, CheckCircle2, ChevronRight, Shield } from 'lucide-react';
import { SessionAsset } from '@/core/types';
import { serializeForOpenMage, OrderValidationService } from '@/core/OpenMageAPI';
import { DynamicConfigLoader, BrandConfig } from '@/core/config';

export default function MainLayout() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<FabricCanvas | null>(null);
    const designState = useDesignStore((s) => s.state);
    const [mounted, setMounted] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [finalPayload, setFinalPayload] = useState<any>(null);
    const [brandConfig, setBrandConfig] = useState<BrandConfig | null>(null);
    const canvasId = useRef(`design-canvas-${Math.random().toString(36).substr(2, 9)}`);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const config = DynamicConfigLoader.loadConfig(params.get('brand'));
            setBrandConfig(config);
            DynamicConfigLoader.applyThemeToDOM(config);
            setIsAdmin(params.get('mode') === 'admin');
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;

        if (canvasRef.current && !fabricRef.current) {
            // Wait for next tick so canvas dimensions explicitly match the client viewport
            setTimeout(() => {
                if (canvasRef.current && !fabricRef.current) {
                    fabricRef.current = new FabricCanvas(canvasRef.current);
                    fabricRef.current.zoomToFit();
                }
            }, 50);
        }

        return () => {
            if (fabricRef.current) {
                fabricRef.current.canvas.dispose();
                fabricRef.current = null;
            }
        };
    }, [mounted]);

    const handleAddText = () => {
        if (fabricRef.current) {
            fabricRef.current.addText();
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. Integrator: Multi-Stage Upload - Create immediate Blob URL
        const proxyUrl = URL.createObjectURL(file);
        const assetId = crypto.randomUUID();

        const newAsset: SessionAsset = {
            id: assetId,
            file,
            proxyUrl,
            status: 'uploading',
            progress: 0
        };

        // Update Zustand
        useDesignStore.getState().syncCanvasState({
            sessionAssets: [...designState.sessionAssets, newAsset]
        });

        // 2. Add to Canvas Instantly (<200ms kinetic rule)
        if (fabricRef.current) {
            fabricRef.current.addImage(proxyUrl, assetId);
        }

        // 3. Mock Background Upload to 'Staging S3'
        let progress = 0;
        const interval = setInterval(() => {
            progress += 25;
            if (progress >= 100) {
                clearInterval(interval);
                // Update asset status to Staged, set mock S3 URL
                const state = useDesignStore.getState().state;
                const updatedAssets = state.sessionAssets.map(a =>
                    a.id === assetId ? { ...a, status: 'staged' as const, progress: 100 } : a
                );

                // Also update the canvas object with the final S3 URL
                const updatedObjects = state.objects.map(obj =>
                    obj.id === assetId && obj.type === 'image'
                        ? { ...obj, s3Url: `s3://staging-bucket/${file.name}` }
                        : obj
                );

                useDesignStore.getState().syncCanvasState({
                    sessionAssets: updatedAssets,
                    objects: updatedObjects as any
                });
            } else {
                const state = useDesignStore.getState().state;
                const updatedAssets = state.sessionAssets.map(a =>
                    a.id === assetId ? { ...a, progress } : a
                );
                useDesignStore.getState().syncCanvasState({ sessionAssets: updatedAssets });
            }
        }, 500);

        // Reset input
        e.target.value = '';
    };

    const handleAddExistingImage = (url: string, id: string) => {
        if (fabricRef.current) {
            fabricRef.current.addImage(url, id);
        }
    };

    const handleReviewClick = () => {
        const payload = serializeForOpenMage();
        setFinalPayload(payload);
        setIsReviewOpen(true);
    };

    if (!mounted) return null; // Prevent hydration mismatch

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Left Toolbar */}
            <aside className="hidden md:flex w-20 bg-white border-r border-slate-200 flex-col items-center py-6 gap-6 z-10 shadow-sm">
                <button
                    className="p-3 bg-brand-primary text-white rounded-xl shadow-md hover:bg-brand-primary-hover active:scale-95 transition-all duration-150 ease-out flex items-center justify-center group relative cursor-pointer"
                    onClick={handleAddText}
                    title="Add Text"
                >
                    <Type size={24} />
                    <span className="absolute left-full ml-4 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-xs px-2 py-1 rounded pointer-events-none transition whitespace-nowrap">Add Text</span>
                </button>
                <div className="relative group">
                    <button className="p-3 bg-brand-primary text-white shadow-md rounded-xl hover:bg-brand-primary-hover active:scale-95 transition-all duration-150 ease-out cursor-pointer" title="Upload Image">
                        <UploadCloud size={24} />
                        <span className="absolute left-full ml-4 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-xs px-2 py-1 rounded pointer-events-none transition whitespace-nowrap z-50">Upload Image</span>
                    </button>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                </div>
            </aside>

            {/* Left Drawer: Image Library */}
            <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col shadow-sm z-10 transition-all duration-300">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                        Session Images
                        <span className="bg-brand-surface text-brand-primary text-xs px-2 py-0.5 rounded-full">{designState.sessionAssets.length}</span>
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {designState.sessionAssets.length === 0 ? (
                        <div className="text-center py-8">
                            <ImageIcon size={32} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-sm text-slate-500">No images uploaded</p>
                            <p className="text-[10px] text-slate-400 mt-1">Drag desktop files here</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {designState.sessionAssets.map(asset => (
                                <div
                                    key={asset.id}
                                    className="relative group aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200 hover:border-brand-accent transition-colors cursor-pointer"
                                    onClick={() => handleAddExistingImage(asset.proxyUrl, crypto.randomUUID())}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={asset.proxyUrl} alt="Upload" className="w-full h-full object-cover" />

                                    {asset.status === 'uploading' && (
                                        <div className="absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur p-2">
                                            <div className="flex items-center justify-between text-[10px] text-brand-primary font-medium mb-1">
                                                <span>Uploading...</span>
                                                <Loader2 size={10} className="animate-spin" />
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-1">
                                                <div className="bg-brand-accent h-1 rounded-full transition-all duration-300" style={{ width: `${asset.progress}%` }}></div>
                                            </div>
                                        </div>
                                    )}
                                    {asset.status === 'staged' && (
                                        <div className="absolute inset-0 bg-brand-accent/0 group-hover:bg-brand-accent/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <Plus size={24} className="text-brand-primary bg-white/90 rounded-full p-1 shadow-sm" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </aside>

            {/* CanvasContainer */}
            <main className="flex-1 flex flex-col pt-8 items-center bg-slate-100/50 overflow-hidden relative">
                <header className="absolute top-4 left-6 right-6 flex justify-between items-center bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl shadow-sm border border-slate-200/50 z-10">
                    <div className="flex items-center gap-3">
                        <h1 className="text-sm font-semibold text-slate-700">Design ID: {designState.design_id}</h1>
                        <span className="text-xs font-mono bg-brand-surface text-brand-primary px-2 py-1 rounded-md border">{designState.version}</span>
                        {isAdmin && (
                            <button
                                onClick={() => {
                                    const json = fabricRef.current?.exportTemplateJSON();
                                    if (!json) return;
                                    const blob = new Blob([json], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `template_${designState.design_id}.json`;
                                    a.click();
                                }}
                                className="ml-2 bg-slate-800 text-white text-[10px] px-3 py-1.5 rounded uppercase tracking-wider font-bold shadow hover:bg-slate-700 transition-colors flex items-center gap-2"
                            >
                                <Shield size={12} />
                                Export Template
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-medium text-slate-500">Synced to LocalStorage</span>
                    </div>
                    <button
                        onClick={handleReviewClick}
                        className="ml-4 flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer"
                    >
                        <ShoppingCart size={16} />
                        Add to Cart
                    </button>
                </header>

                {/* Live Preview UI strictly for verification */}
                {designState.preview && (
                    <div className="absolute top-20 right-6 bg-white p-2 rounded-lg shadow-sm border border-slate-200 z-10">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Live Thumbnail</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={designState.preview} alt="preview" className="w-24 h-auto border border-slate-100 rounded" />
                    </div>
                )}

                <div className="flex-1 flex items-center justify-center p-12 w-full">
                    <div className="relative shadow-2xl ring-1 ring-slate-900/5 bg-white transition-all transform hover:shadow-xl rounded-sm overflow-hidden flex" style={{ width: 800, height: 600 }}>
                        {/* Safe zone overlay (visual only, events passthrough) */}
                        <div className="absolute inset-0 pointer-events-none border border-pink-500/0 hover:border-pink-500/30 transition-colors z-50 m-[20px] rounded-sm flex items-center justify-center">
                            <span className="text-pink-500/0 hover:text-pink-500/50 text-[10px] font-bold tracking-widest uppercase transition-colors">Safe Zone</span>
                        </div>

                        <canvas
                            ref={canvasRef}
                            id={canvasId.current}
                            width={designState.canvasWidth}
                            height={designState.canvasHeight}
                            className="bg-white"
                        />
                    </div>
                </div>
            </main>

            {/* Responsive ContextualPropertiesPanel (Bottom Sheet on Mobile / Sidebar on Desktop) */}
            <aside className={`fixed inset-x-0 bottom-[68px] rounded-t-3xl max-h-[75vh] transition-transform duration-300 ease-out z-40 ${isMobileSheetOpen ? 'translate-y-0' : 'translate-y-full'} md:translate-y-0 md:relative md:inset-auto md:bottom-auto md:max-h-none md:rounded-none md:w-80 md:flex md:flex-col bg-white border-l border-slate-200 p-6 overflow-y-auto shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-sm`}>
                <div className="md:hidden flex justify-center pb-6 mt-[-10px] cursor-pointer" onClick={() => setIsMobileSheetOpen(false)}>
                    <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
                </div>

                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    Properties
                    <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full">{designState.objects.length}</span>
                </h2>

                {designState.objects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <p className="text-sm text-slate-500 font-medium">No layer selected</p>
                        <p className="text-xs text-slate-400 mt-1">Click the Text icon to add an object</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Canvas Specs</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="block text-[10px] text-slate-400 uppercase">Width</span>
                                    <span className="font-medium text-slate-700">{designState.canvasWidth}px</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] text-slate-400 uppercase">Height</span>
                                    <span className="font-medium text-slate-700">{designState.canvasHeight}px</span>
                                </div>
                            </div>
                        </div>

                        {/* Text Properties - Shows if a Text Layer is active (mock logic for demo: checks objects) */}
                        {designState.objects.some(o => o.type === 'textbox' || o.type === 'text') && (
                            <div>
                                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Typography Vibe</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-[10px] uppercase text-indigo-500 font-semibold mb-1">Industrial</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => fabricRef.current?.updateFontFamily('impact')}
                                                className="p-2 border border-slate-200 rounded text-sm hover:border-indigo-400 bg-white font-[impact] cursor-pointer text-center whitespace-nowrap overflow-hidden text-ellipsis"
                                            >
                                                Impact
                                            </button>
                                            <button
                                                onClick={() => fabricRef.current?.updateFontFamily('courier')}
                                                className="p-2 border border-slate-200 rounded text-sm hover:border-indigo-400 bg-white font-mono cursor-pointer text-center"
                                            >
                                                Courier
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] uppercase text-indigo-500 font-semibold mb-1">Modern</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => fabricRef.current?.updateFontFamily('sans-serif')}
                                                className="p-2 border border-slate-200 rounded text-sm hover:border-indigo-400 bg-white font-sans cursor-pointer text-center"
                                            >
                                                System Default
                                            </button>
                                            <button
                                                onClick={() => fabricRef.current?.updateFontFamily('verdana')}
                                                className="p-2 border border-slate-200 rounded text-sm hover:border-indigo-400 bg-white cursor-pointer text-center"
                                                style={{ fontFamily: 'verdana' }}
                                            >
                                                Verdana
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] uppercase text-indigo-500 font-semibold mb-1">Elegant</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => fabricRef.current?.updateFontFamily('georgia')}
                                                className="p-2 border border-slate-200 rounded text-sm hover:border-indigo-400 bg-white font-serif cursor-pointer text-center"
                                            >
                                                Georgia
                                            </button>
                                            <button
                                                onClick={() => fabricRef.current?.updateFontFamily('palatino')}
                                                className="p-2 border border-slate-200 rounded text-sm hover:border-indigo-400 bg-white cursor-pointer text-center"
                                                style={{ fontFamily: 'palatino' }}
                                            >
                                                Palatino
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {isAdmin && (
                                    <div className="mt-6 pt-6 border-t border-slate-200">
                                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1">
                                            <Shield size={12} />
                                            Admin: Template Mapping
                                        </h3>
                                        <select
                                            className="w-full p-2 border border-slate-200 rounded text-sm bg-white"
                                            onChange={(e) => fabricRef.current?.setPlaceholderKey(e.target.value)}
                                        >
                                            <option value="">No Mapping (Static Text)</option>
                                            {['{{USER_NAME}}', '{{EMAIL}}', '{{PHONE}}', '{{COMPANY}}'].map(key => (
                                                <option key={key} value={key}>{key}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <p className="text-[10px] text-slate-400 mt-3 italic text-center">Double-click text on canvas to type</p>
                            </div>
                        )}

                        {/* Image Properties */}
                        {designState.objects.some(o => o.type === 'image') && (
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">AI Image Tools</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => fabricRef.current?.removeBackgroundForActiveObject()}
                                        className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer text-sm font-semibold"
                                        title="Uses AI to isolate the subject."
                                    >
                                        <ImageIcon size={16} />
                                        Remove BG
                                    </button>
                                    <button
                                        onClick={() => fabricRef.current?.vectorizeActiveObject()}
                                        className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer text-sm font-semibold"
                                        title="Converts pixels to infinite-scale vector paths."
                                    >
                                        <UploadCloud size={16} />
                                        Vectorize
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Pulse Debug view of recent objects tracking real-time movement */}
                        <div>
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                                <span>Layers & Live Sync</span>
                                <span className="text-green-500 text-[10px] animate-pulse">● Live</span>
                            </h3>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {/* Map blocks in reverse so top layers are visually listed first */}
                                {[...designState.objects].reverse().map((obj) => (
                                    <div key={obj.id} className={`text-xs p-3 border rounded-lg shadow-sm transition-colors ${obj.locked ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-white border-slate-200 hover:border-brand-accent'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-slate-700 capitalize flex items-center gap-2">
                                                <Type size={14} className="text-brand-accent" />
                                                {obj.type} LAYER
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => fabricRef.current?.toggleLock(obj.id)}
                                                    className={`p-1 rounded cursor-pointer transition-colors ${obj.locked ? 'text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                                    title={obj.locked ? "Unlock Layer" : "Lock Layer"}
                                                >
                                                    {obj.locked ? '🔒' : '🔓'}
                                                </button>
                                                {(obj as any).isFontLoading ? (
                                                    <span className="text-[10px] text-brand-accent font-medium flex items-center gap-1">
                                                        <Loader2 size={10} className="animate-spin" />
                                                        Fetching
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 font-mono">z:{obj.zIndex}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-y-2 mt-2 bg-slate-50 p-2 rounded text-[10px] font-mono text-slate-600">
                                            <div><span className="text-slate-400">X:</span> {Math.round(obj.left)}</div>
                                            <div><span className="text-slate-400">Y:</span> {Math.round(obj.top)}</div>
                                            <div><span className="text-slate-400">W:</span> {Math.round(obj.width)}</div>
                                            <div><span className="text-slate-400">H:</span> {Math.round(obj.height)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Warnings Drawer */}
                        {designState.warnings.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-slate-200 animate-in slide-in-from-bottom-2 fade-in duration-300">
                                <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <AlertTriangle size={14} />
                                    Production Warnings ({designState.warnings.length})
                                </h3>
                                <div className="space-y-2">
                                    {designState.warnings.map((warning) => (
                                        <div key={warning.id} className="text-xs bg-red-50 text-red-700 p-3 rounded-lg flex items-start gap-2 border border-red-100">
                                            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-semibold uppercase text-[10px] tracking-wide mb-0.5">{warning.type} Risk</p>
                                                <p>{warning.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </aside>

            {/* Final Review Modal */}
            {isReviewOpen && finalPayload && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <ShoppingCart className="text-brand-primary" />
                                Order Review
                            </h2>
                            <button
                                onClick={() => setIsReviewOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto grid md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Design Preview</h3>
                                <div className="bg-slate-100 rounded-xl p-4 border border-slate-200 flex items-center justify-center aspect-[4/3]">
                                    {designState.preview ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={designState.preview} alt="Final Review" className="max-w-full max-h-full object-contain drop-shadow-md" />
                                    ) : (
                                        <span className="text-slate-400 text-sm">No preview available</span>
                                    )}
                                </div>
                                <div className="mt-4 flex gap-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div><span className="block text-[10px] uppercase text-slate-400 font-bold mb-0.5">Physical Size</span>8&quot; × 6&quot;</div>
                                    <div><span className="block text-[10px] uppercase text-slate-400 font-bold mb-0.5">Bleed Margin</span>0.25&quot;</div>
                                </div>

                                {/* Production Agent: Final Pre-Flight Checklist */}
                                <div className="mt-6">
                                    <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        Production Pre-Flight
                                    </h3>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex items-center gap-2 text-slate-600">
                                            {designState.warnings.some(w => w.type === 'dpi') ? (
                                                <AlertTriangle size={16} className="text-red-500" />
                                            ) : (
                                                <CheckCircle2 size={16} className="text-green-500" />
                                            )}
                                            <span>Image Resolution (DPI)</span>
                                        </li>
                                        <li className="flex items-center gap-2 text-slate-600">
                                            {designState.warnings.some(w => w.type === 'bleed') ? (
                                                <AlertTriangle size={16} className="text-red-500" />
                                            ) : (
                                                <CheckCircle2 size={16} className="text-green-500" />
                                            )}
                                            <span>Safe Zone & Bleed Margins</span>
                                        </li>
                                        <li className="flex items-center gap-2 text-slate-600">
                                            <CheckCircle2 size={16} className="text-green-500" />
                                            <span>Text Legibility & Thickness</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="flex flex-col border-l border-slate-100 pl-8">
                                <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Production Validation</h3>

                                {finalPayload.is_orderable ? (
                                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 flex items-start gap-3 mb-6">
                                        <CheckCircle2 className="shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-sm">Print Ready</p>
                                            <p className="text-xs mt-1 text-emerald-600">Your design passes all automated pre-flight checks (150+ DPI, inside safe zones).</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-start gap-3 mb-6 shadow-sm">
                                        <AlertTriangle className="shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-sm">Production Risks Detected</p>
                                            <p className="text-xs mt-1 text-red-600 mb-3">Your design has {designState.warnings.length} active warning(s). By proceeding, you accept responsibility for any print quality issues.</p>
                                            <label className="flex items-center gap-2 cursor-pointer bg-white/50 p-2 rounded border border-red-200/50">
                                                <input type="checkbox" className="accent-red-600 w-4 h-4 cursor-pointer" />
                                                <span className="text-xs font-semibold select-none">I understand the risks. Proceed anyway.</span>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wider flex justify-between">
                                        <span>OpenMage Contract Data</span>
                                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 rounded-full flex items-center">{finalPayload.system_metadata.design_version}</span>
                                    </h3>
                                    <div className="bg-slate-800 text-green-400 p-3 rounded-xl overflow-x-auto text-[10px] font-mono shadow-inner border border-slate-700 h-[200px] custom-scrollbar">
                                        <pre>{JSON.stringify(finalPayload, null, 2)}</pre>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsReviewOpen(false)}
                                className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                                Back to Editor
                            </button>
                            <button className="px-5 py-2.5 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-primary-hover transition-colors shadow-md flex items-center gap-2 cursor-pointer">
                                Confirm & Checkout
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around px-4 py-2 z-50 shadow-[0_-4px_20px_rgb(0,0,0,0.05)] pb-safe">
                <button onClick={handleAddText} className="flex flex-col items-center p-2 text-slate-500 hover:text-brand-primary active:scale-95 transition-transform">
                    <Type size={20} />
                    <span className="text-[10px] font-semibold mt-1">Text</span>
                </button>
                <div className="relative flex flex-col items-center p-2 text-slate-500 hover:text-brand-primary active:scale-95 transition-transform">
                    <UploadCloud size={20} />
                    <span className="text-[10px] font-semibold mt-1">Upload</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <button
                    onClick={() => {
                        setIsMobileSheetOpen(!isMobileSheetOpen);
                        fabricRef.current?.zoomToFit();
                    }}
                    className="flex flex-col items-center p-2 text-slate-500 hover:text-brand-primary active:scale-95 transition-transform relative"
                >
                    <div className="relative">
                        <ImageIcon size={20} />
                        {designState.warnings.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-bold text-white flex justify-center items-center">!</span>
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-semibold mt-1">Tools</span>
                </button>
            </nav>

            {/* Theme Previewer */}
            <div className="fixed bottom-4 left-4 flex flex-col gap-2 z-50 bg-white p-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
                <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1 truncate">Theme Previewer</p>
                <div className="flex gap-2">
                    <button onClick={() => window.location.search = '?brand=stickylife'} className="px-3 py-1.5 text-xs font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors cursor-pointer">StickyLife</button>
                    <button onClick={() => window.location.search = '?brand=wallmonkeys'} className="px-3 py-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors cursor-pointer">WallMonkeys</button>
                    <button onClick={() => window.location.search = '?brand=hcbrands'} className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors cursor-pointer">HC Brands</button>
                </div>
            </div>
        </div>
    );
}
