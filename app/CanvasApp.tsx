'use client';

import { useEffect, useRef, useState } from 'react';
import { DynamicConfigLoader, BrandConfig } from '@/core/config';
import { HC_BRANDS_CATALOG } from '@/core/templates';
import { FabricCanvas } from '@/core/FabricCanvas';
import { useDesignStore } from '@/core/storage';
import {
    Type, Image as ImageIcon, AlertTriangle, UploadCloud, Loader2,
    ShoppingCart, CheckCircle2, ChevronRight, Shield, Trash2, Copy,
    Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
    Minus, Plus, Undo2, Redo2, Share2, LayoutGrid, Layers,
    MoreHorizontal,
    Sparkles, Download, ZoomIn, ZoomOut, Search,
    Cloud, MessageSquare, BarChart2, FolderOpen, PenTool, Grid, Blocks,
    Wand2, Settings2, Clock, Sticker, ArrowUpToLine, ArrowDownToLine, MousePointer2, Pen, ChevronDown, Crop, Lock, Unlock,
    Menu as DownloadMenu, Info, Users, ExternalLink, Activity, PlayCircle, BarChart, Eye, Link
} from 'lucide-react';
import { SessionAsset } from '@/core/types';
import { serializeForOpenMage, OrderValidationService } from '@/core/OpenMageAPI';

type SidebarPanel = 'templates' | 'elements' | 'text' | 'brand' | 'uploads' | 'draw' | 'projects' | 'apps' | 'layers' | null;

export default function CanvasApp() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<FabricCanvas | null>(null);
    const designState = useDesignStore((s) => s.state);
    const [mounted, setMounted] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
    const [finalPayload, setFinalPayload] = useState<any>(null);
    const [brandConfig, setBrandConfig] = useState<BrandConfig | null>(null);
    const [activePanel, setActivePanel] = useState<SidebarPanel>('text');
    // AI Tools State
    const [isRemovingBg, setIsRemovingBg] = useState(false);

    // Sidebar Search States
    const [templateSearchQuery, setTemplateSearchQuery] = useState('');
    const [isGenFillActive, setIsGenFillActive] = useState(false);
    const [genFillPrompt, setGenFillPrompt] = useState('');
    const [zoom, setZoom] = useState(100);
    const [activeHeaderMenu, setActiveHeaderMenu] = useState<'file' | 'resize' | 'share' | 'analytics' | null>(null);
    const canvasId = useRef(`design - canvas - ${Math.random().toString(36).substr(2, 9)} `);

    // ── Lifecycle ───────────────────────────────────────────────
    useEffect(() => {
        setMounted(true);
        const params = new URLSearchParams(window.location.search);
        const currentBrand = params.get('brand') || 'stickylife';
        const config = DynamicConfigLoader.loadConfig(currentBrand);
        setBrandConfig(config);
        DynamicConfigLoader.applyThemeToDOM(config);
        setIsAdmin(params.get('mode') === 'admin');

        const storedBrand = useDesignStore.getState().state.brandId;
        if (storedBrand && storedBrand !== currentBrand && useDesignStore.getState().state.objects.length > 0) {
            if (window.confirm(`Switching from ${storedBrand} to ${currentBrand}. Clear canvas ? `)) {
                useDesignStore.getState().syncCanvasState({ objects: [], sessionAssets: [], warnings: [], brandId: currentBrand });
            } else {
                useDesignStore.getState().syncCanvasState({ brandId: currentBrand });
            }
        } else if (!storedBrand) {
            useDesignStore.getState().syncCanvasState({ brandId: currentBrand });
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;
        if (canvasRef.current && !fabricRef.current) {
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

    // ── Retina Mapping ──────────────────────────────────────────
    useEffect(() => {
        const handleResize = () => {
            if (fabricRef.current) {
                fabricRef.current.canvas.calcOffset();
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ── Global Hotkeys ──────────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            const activeObj = fabricRef.current?.canvas.getActiveObject() as any;
            if (activeObj && activeObj.isEditing) return; // Ignore hotkeys if user is mid-typing

            if (e.key.toLowerCase() === 't' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); handleAddText(); }
            else if (e.key.toLowerCase() === 'r' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); fabricRef.current?.addShape('rect'); }
            else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); fabricRef.current?.deleteSelected(); }
            else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') { e.preventDefault(); fabricRef.current?.copy(); }
            else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') { e.preventDefault(); fabricRef.current?.paste(); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // ── Handlers ────────────────────────────────────────────────
    const handleAddText = (textStr: string = 'Your text here', options: { fontSize?: number, fontWeight?: string | number } = {}) => {
        fabricRef.current?.addText(textStr, options);
    };
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
        let file: File | undefined;
        if ('dataTransfer' in e) {
            file = e.dataTransfer.files?.[0];
        } else {
            file = (e.target as HTMLInputElement).files?.[0];
        }

        if (!file || !file.type.startsWith('image/')) return;

        const proxyUrl = URL.createObjectURL(file);
        const assetId = crypto.randomUUID();
        const newAsset: SessionAsset = { id: assetId, file, proxyUrl, status: 'uploading', progress: 0 };
        useDesignStore.getState().syncCanvasState({ sessionAssets: [...useDesignStore.getState().state.sessionAssets, newAsset] });
        if (fabricRef.current) fabricRef.current.addImage(proxyUrl, assetId);
        let progress = 0;
        const interval = setInterval(() => {
            progress += 25;
            if (progress >= 100) {
                clearInterval(interval);
                const state = useDesignStore.getState().state;
                const updatedAssets = state.sessionAssets.map(a => a.id === assetId ? { ...a, status: 'staged' as const, progress: 100 } : a);
                const updatedObjects = state.objects.map(obj => obj.id === assetId && obj.type === 'image' ? { ...obj, s3Url: `s3://staging-bucket/${file.name}` } : obj);
                useDesignStore.getState().syncCanvasState({ sessionAssets: updatedAssets, objects: updatedObjects as any });
            } else {
                const state = useDesignStore.getState().state;
                const updatedAssets = state.sessionAssets.map(a => a.id === assetId ? { ...a, progress } : a);
                useDesignStore.getState().syncCanvasState({ sessionAssets: updatedAssets });
            }
        }, 500);

        if ('target' in e && e.target instanceof HTMLInputElement) {
            e.target.value = '';
        }
    };
    const handleReviewClick = () => { setFinalPayload(serializeForOpenMage()); setIsReviewOpen(true); };
    const togglePanel = (panel: SidebarPanel) => {
        if (activePanel === panel && !isPanelCollapsed) {
            setIsPanelCollapsed(true);
        } else {
            setActivePanel(panel);
            setIsPanelCollapsed(false);
        }
    };

    // Find active object
    const activeObj = designState.objects.find(o => o.id === designState.activeObjectId) as any;
    const isTextSelected = activeObj && ['textbox', 'text', 'i-text'].includes(activeObj.type);
    const isShapeSelected = activeObj && ['rect', 'circle', 'triangle', 'polygon', 'path'].includes(activeObj.type);
    const isImageSelected = activeObj && activeObj.type === 'image';

    // Drawing State
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushType, setBrushType] = useState('marker');
    const [brushColor, setBrushColor] = useState('#8b5cf6');
    const [brushWidth, setBrushWidth] = useState(12);

    // Sync drawing state to Fabric whenever it changes
    useEffect(() => {
        if (fabricRef.current && activePanel === 'draw') {
            fabricRef.current.toggleDrawingMode(isDrawing, { type: brushType, color: brushColor, width: brushWidth });
        } else if (fabricRef.current && activePanel !== 'draw' && isDrawing) {
            // Auto-disable drawing if we navigate away from the Draw tab
            setIsDrawing(false);
            fabricRef.current.toggleDrawingMode(false, { type: brushType, color: brushColor, width: brushWidth });
        }
    }, [isDrawing, brushType, brushColor, brushWidth, activePanel]);

    const handleRemoveBgMock = async () => {
        if (!fabricRef.current) return;
        const activeObj = fabricRef.current.canvas.getActiveObject() as any;
        if (!activeObj || activeObj.type !== 'image') return;

        setIsRemovingBg(true);
        // Mock API latency
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock transparent PNG cutout
        const mockCutoutUrl = 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&auto=format&fit=crop';

        fabricRef.current.addImage(mockCutoutUrl, activeObj.id);
        fabricRef.current.canvas.remove(activeObj);
        setIsRemovingBg(false);
    };

    const handleGenFillMock = async () => {
        if (!fabricRef.current || !genFillPrompt.trim()) return;
        setIsGenFillActive(true);
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Inject a generated mockup image
        const generatedMockUrl = 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=500&auto=format&fit=crop';
        fabricRef.current.addImage(generatedMockUrl, crypto.randomUUID());
        setIsGenFillActive(false);
        setGenFillPrompt('');
    };

    if (!mounted) return null;

    // ────────────────────────────────────────────────────────────
    // CANVA-LEVEL LAYOUT
    // ────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-screen bg-[#1e1e2e] text-white overflow-hidden" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

            {/* ═══════════ TOP NAV BAR ═══════════ */}
            <header className="h-[52px] bg-[#1e1e2e] border-b border-white/10 flex items-center px-4 gap-3 shrink-0 z-20">
                {/* Left cluster */}
                <div className="flex items-center gap-2 relative">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                        <Sparkles size={16} className="text-white" />
                    </div>
                    <button onClick={() => setActiveHeaderMenu(activeHeaderMenu === 'file' ? null : 'file')} className={`text-sm px-3 py-1.5 rounded-md transition-colors cursor-pointer ${activeHeaderMenu === 'file' ? 'bg-white/20 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>File</button>
                    <button onClick={() => setActiveHeaderMenu(activeHeaderMenu === 'resize' ? null : 'resize')} className={`text-sm px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${activeHeaderMenu === 'resize' ? 'bg-white/20 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>
                        <Sparkles size={12} /> Resize
                    </button>
                </div>

                {/* Undo/Redo & Sync */}
                <div className="flex items-center gap-1 ml-2 border-l border-white/10 pl-3">
                    <button onClick={() => fabricRef.current?.undo()} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer" aria-label="Undo" title="Undo"><Undo2 size={16} /></button>
                    <button onClick={() => fabricRef.current?.redo()} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer" aria-label="Redo" title="Redo"><Redo2 size={16} /></button>
                    <div className="flex items-center gap-1.5 px-2 ml-1 text-white/40" title="Changes saved to cloud">
                        <Cloud size={16} /> <CheckCircle2 size={10} className="absolute ml-2.5 mt-2.5 bg-[#1e1e2e] rounded-full text-white" />
                    </div>
                </div>

                {/* Center title */}
                <div className="flex-1 flex justify-center">
                    <span className="text-sm text-white/60 bg-white/5 px-4 py-1.5 rounded-lg border border-white/10">
                        {brandConfig?.name || 'Design'} — Custom Design
                    </span>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-2">
                    {/* Collaborator Avatars */}
                    <div className="flex items-center mr-2">
                        <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold ring-2 ring-[#1e1e2e] z-10" aria-label="Kendall Dale" title="Kendall Dale">K</div>
                        <button className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white ring-2 ring-[#1e1e2e] z-0 transition-colors ml-1 cursor-pointer" aria-label="Share Design" title="Share Design">
                            <Plus size={14} />
                        </button>
                    </div>

                    <button onClick={() => setActiveHeaderMenu(activeHeaderMenu === 'analytics' ? null : 'analytics')} className={`p-1.5 rounded-md transition-colors cursor-pointer ${activeHeaderMenu === 'analytics' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`} aria-label="Analytics" title="Analytics"><BarChart2 size={18} /></button>
                    <button className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer" aria-label="Comments" title="Comments"><MessageSquare size={18} /></button>

                    {isAdmin && (
                        <button
                            onClick={() => {
                                const json = fabricRef.current?.exportTemplateJSON();
                                if (!json) return;
                                const blob = new Blob([json], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a'); a.href = url;
                                a.download = `template_${designState.design_id}.json`; a.click();
                            }}
                            className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-white/80 px-3 py-1.5 rounded-lg transition-colors ml-2"
                        >
                            <Shield size={12} /> Export
                        </button>
                    )}
                    <button onClick={() => setActiveHeaderMenu(activeHeaderMenu === 'share' ? null : 'share')} className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ml-1 cursor-pointer ${activeHeaderMenu === 'share' ? 'bg-white/40 text-white' : 'bg-white/20 hover:bg-white/30 text-white'}`}>
                        <Share2 size={14} /> Share
                    </button>
                    <button
                        onClick={handleReviewClick}
                        disabled={designState.objects.length === 0}
                        className={`flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg transition-colors font-medium shadow-lg ml-1 ${designState.objects.length === 0 ? 'bg-violet-600/50 text-white/50 cursor-not-allowed shadow-none' : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/25 cursor-pointer'}`}
                    >
                        <Download size={14} /> Add to Cart
                    </button>
                </div>
            </header>

            {/* ═══════════ HEADER DROPDOWN MODALS ═══════════ */}
            {activeHeaderMenu && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setActiveHeaderMenu(null)}
                >
                    <div className="absolute top-[56px] w-[280px] bg-[#252536] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 flex flex-col pointer-events-auto" onClick={e => e.stopPropagation()} style={
                        activeHeaderMenu === 'file' ? { left: '48px' } :
                            activeHeaderMenu === 'resize' ? { left: '100px' } :
                                activeHeaderMenu === 'share' ? { right: '140px', width: '320px' } :
                                    { right: '180px', width: '300px' } // Analytics
                    }>
                        {activeHeaderMenu === 'file' && (
                            <div className="p-2 space-y-0.5">
                                <button className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg text-sm transition-colors flex items-center justify-between group cursor-pointer text-white/90">
                                    <div className="flex items-center gap-3"><Plus size={16} className="text-white/50 group-hover:text-white" /> Create new design</div>
                                </button>
                                <button className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg text-sm transition-colors flex items-center justify-between group cursor-pointer text-white/90">
                                    <div className="flex items-center gap-3"><FolderOpen size={16} className="text-white/50 group-hover:text-white" /> Save to folder</div>
                                </button>
                                <div className="h-px bg-white/10 my-1 mx-2" />
                                <button className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg text-sm transition-colors flex items-center justify-between group cursor-pointer text-white/90">
                                    <div className="flex items-center gap-3"><Copy size={16} className="text-white/50 group-hover:text-white" /> Make a copy</div>
                                </button>
                                <button className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg text-sm transition-colors flex items-center justify-between group cursor-pointer text-white/90">
                                    <div className="flex items-center gap-3"><Download size={16} className="text-white/50 group-hover:text-white" /> Download</div>
                                    <span className="text-[10px] text-white/40 tracking-widest font-mono">⌘D</span>
                                </button>
                                <button className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg text-sm transition-colors flex items-center justify-between group cursor-pointer text-white/90">
                                    <div className="flex items-center gap-3"><Settings2 size={16} className="text-white/50 group-hover:text-white" /> Version history</div>
                                </button>
                            </div>
                        )}

                        {activeHeaderMenu === 'resize' && (
                            <div className="p-4">
                                <h4 className="text-sm font-semibold mb-3">Custom Size</h4>
                                <div className="flex gap-2 mb-4">
                                    <div className="flex-1 bg-black/20 rounded-lg p-2 border border-white/10">
                                        <div className="text-[10px] text-white/40 uppercase font-semibold mb-1">Width</div>
                                        <input type="text" defaultValue="800" className="w-full bg-transparent text-sm focus:outline-none" />
                                    </div>
                                    <div className="flex-1 bg-black/20 rounded-lg p-2 border border-white/10">
                                        <div className="text-[10px] text-white/40 uppercase font-semibold mb-1">Height</div>
                                        <input type="text" defaultValue="600" className="w-full bg-transparent text-sm focus:outline-none" />
                                    </div>
                                    <div className="bg-black/20 rounded-lg p-2 border border-white/10 flex items-center justify-center">
                                        <span className="text-sm text-white/60 px-1">px</span>
                                    </div>
                                </div>
                                <div className="h-px bg-white/10 mb-4" />
                                <button className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 text-white font-medium py-2 rounded-lg text-sm flex items-center justify-center gap-2 cursor-pointer transition-opacity">
                                    <Sparkles size={16} /> Magic Resize
                                </button>
                            </div>
                        )}

                        {activeHeaderMenu === 'share' && (
                            <div className="p-4 flex flex-col gap-4">
                                <div className="flex items-center justify-between w-full p-2 bg-black/20 rounded-lg border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold text-xs">K</div>
                                        <div className="text-sm font-medium">Kendall Dale (You)</div>
                                    </div>
                                    <span className="text-xs text-white/50">Owner</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center text-xs font-semibold text-white/60 uppercase mb-1">Collaboration Link</div>
                                    <div className="flex items-center w-full bg-black/20 rounded-lg border border-white/10 overflow-hidden">
                                        <div className="p-2 border-r border-white/10 text-white/40"><Link size={14} /></div>
                                        <div className="flex-1 px-3 text-sm text-white/70 overflow-hidden text-ellipsis whitespace-nowrap bg-transparent outline-none py-2 pointer-events-none">https://stickylife.com/design/abc-123</div>
                                        <button className="px-3 py-2 text-sm text-violet-400 font-semibold hover:bg-white/5 transition-colors cursor-pointer">Copy</button>
                                    </div>
                                    <select className="w-full bg-transparent text-sm text-white/80 p-2 border border-white/10 rounded-lg mt-1 outline-none appearance-none cursor-pointer">
                                        <option value="anyone" className="bg-[#252536]">Anyone with the link can edit</option>
                                        <option value="restricted" className="bg-[#252536]">Only people invited can access</option>
                                    </select>
                                </div>
                                <button className="w-full mt-2 bg-white/10 hover:bg-white/20 text-white font-medium py-2 rounded-lg text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors border border-white/5">
                                    <Download size={16} /> Download
                                </button>
                            </div>
                        )}

                        {activeHeaderMenu === 'analytics' && (
                            <div className="p-4">
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Activity size={16} className="text-violet-400" /> Design Insights</h4>
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <div className="bg-black/20 p-3 rounded-lg border border-white/10">
                                        <div className="text-xs text-white/50 mb-1 flex items-center gap-1"><Eye size={12} /> Views</div>
                                        <div className="text-xl font-bold">1,204</div>
                                        <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">+12% this week</div>
                                    </div>
                                    <div className="bg-black/20 p-3 rounded-lg border border-white/10">
                                        <div className="text-xs text-white/50 mb-1 flex items-center gap-1"><MousePointer2 size={12} /> Clicks</div>
                                        <div className="text-xl font-bold">342</div>
                                        <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">+5% this week</div>
                                    </div>
                                </div>
                                <div className="h-24 w-full bg-white/5 rounded-lg border border-white/10 flex items-end justify-between px-4 pb-2 pt-6 relative overflow-hidden">
                                    {/* Mock small bar chart */}
                                    <div className="absolute top-2 left-2 text-[10px] text-white/40">Past 7 days</div>
                                    {[40, 60, 45, 80, 50, 90, 70].map((h, i) => (
                                        <div key={i} className="w-6 bg-violet-500/50 rounded-t-sm hover:bg-violet-400 transition-colors" style={{ height: `${h}%` }} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════ CONTEXT TOOLBAR (appears when object is selected) ═══════════ */}
            <div className="h-[48px] bg-[#2a2a3d] border-b border-white/5 flex items-center px-4 gap-2 shrink-0">
                {isTextSelected ? (
                    <>
                        {/* Font family restricted by Brand Kit */}
                        <div className="relative group/font">
                            <button className="flex items-center justify-between gap-2 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg text-sm text-white/90 min-w-[140px] transition-colors cursor-pointer" aria-label="Font Family" title="Font Family">
                                <span>{activeObj.fontFamily || 'Sans Serif'}</span> <ChevronDown size={12} className="text-white/40 group-hover/font:rotate-180 transition-transform" />
                            </button>
                            <div className="absolute top-full left-0 mt-1 w-[180px] bg-[#2a2a3d] border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover/font:opacity-100 group-hover/font:visible transition-all z-50 overflow-hidden flex flex-col">
                                {(!isAdmin && brandConfig?.typography.fonts) ? (
                                    brandConfig.typography.fonts.map(font => (
                                        <button key={font} onClick={() => fabricRef.current?.updateFontFamily(font)} className="text-left px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors font-medium">
                                            {font} <span className="text-[10px] text-violet-400 ml-1 rounded-sm bg-violet-400/10 px-1 py-0.5">Brand</span>
                                        </button>
                                    ))
                                ) : (
                                    ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat'].map(font => (
                                        <button key={font} onClick={() => fabricRef.current?.updateFontFamily(font)} className="text-left px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors">
                                            {font}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                        {/* Font size */}
                        <div className="flex items-center bg-white/10 rounded-lg overflow-hidden" aria-label="Font Size">
                            <button onClick={() => fabricRef.current?.updateActiveObjectProperty('fontSize', Math.max(8, (activeObj.fontSize || 24) - 2))} className="px-2 py-1.5 text-white/50 hover:text-white hover:bg-white/10 transition-colors" aria-label="Decrease Font Size" title="Decrease Font Size"><Minus size={14} /></button>
                            <span className="text-sm text-white/90 px-2 min-w-[32px] text-center">{Math.round(activeObj.fontSize || 24)}</span>
                            <button onClick={() => fabricRef.current?.updateActiveObjectProperty('fontSize', (activeObj.fontSize || 24) + 2)} className="px-2 py-1.5 text-white/50 hover:text-white hover:bg-white/10 transition-colors" aria-label="Increase Font Size" title="Increase Font Size"><Plus size={14} /></button>
                        </div>
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        {/* Color */}
                        <label className="w-7 h-7 rounded-lg border-2 border-white/20 hover:border-white/40 transition-colors cursor-pointer block relative overflow-hidden" style={{ backgroundColor: (activeObj.fill as string) || '#000' }} title="Text Color" aria-label="Text Color">
                            <input type="color" className="absolute opacity-0 w-full h-full cursor-pointer inset-0 default-color-picker" value={(activeObj.fill as string) || '#000000'} onChange={(e) => fabricRef.current?.updateActiveObjectProperty('fill', e.target.value)} />
                        </label>
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        {/* B I U */}
                        <button onClick={() => fabricRef.current?.toggleActiveObjectProperty('fontWeight', 'bold', 'normal')} className={`p-1.5 rounded-md transition-colors cursor-pointer ${activeObj.fontWeight === 'bold' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'}`} aria-label="Bold" title="Bold"><Bold size={16} /></button>
                        <button onClick={() => fabricRef.current?.toggleActiveObjectProperty('fontStyle', 'italic', 'normal')} className={`p-1.5 rounded-md transition-colors cursor-pointer ${activeObj.fontStyle === 'italic' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'}`} aria-label="Italic" title="Italic"><Italic size={16} /></button>
                        <button onClick={() => fabricRef.current?.toggleActiveObjectProperty('underline', true, false)} className={`p-1.5 rounded-md transition-colors cursor-pointer ${activeObj.underline ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'}`} aria-label="Underline" title="Underline"><Underline size={16} /></button>
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        {/* Alignment */}
                        <button onClick={() => fabricRef.current?.updateActiveObjectProperty('textAlign', 'left')} className={`p-1.5 rounded-md transition-colors cursor-pointer ${activeObj.textAlign === 'left' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'}`} aria-label="Align Left" title="Align Left"><AlignLeft size={16} /></button>
                        <button onClick={() => fabricRef.current?.updateActiveObjectProperty('textAlign', 'center')} className={`p-1.5 rounded-md transition-colors cursor-pointer ${activeObj.textAlign === 'center' || !activeObj.textAlign ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'}`} aria-label="Align Center" title="Align Center"><AlignCenter size={16} /></button>
                        <button onClick={() => fabricRef.current?.updateActiveObjectProperty('textAlign', 'right')} className={`p-1.5 rounded-md transition-colors cursor-pointer ${activeObj.textAlign === 'right' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'}`} aria-label="Align Right" title="Align Right"><AlignRight size={16} /></button>
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        {/* Text Effects: Stroke & Shadow */}
                        <div className="flex items-center gap-2 group relative">
                            <button className="text-sm text-white/60 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-md transition-colors cursor-pointer">Effects</button>
                            <div className="absolute top-full left-0 mt-2 p-3 w-64 bg-[#2a2a3d] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                {/* Stroke */}
                                <div className="mb-4">
                                    <div className="text-xs font-semibold text-white/70 mb-2">Outline (Stroke)</div>
                                    <div className="flex items-center gap-3">
                                        <label className="w-6 h-6 rounded-full border-2 border-white/20 hover:border-white/40 transition-colors cursor-pointer block relative overflow-hidden" style={{ backgroundColor: (activeObj.stroke as string) || 'transparent' }}>
                                            <input type="color" className="absolute opacity-0 w-full h-full cursor-pointer inset-0" value={(activeObj.stroke as string) || '#000000'} onChange={(e) => fabricRef.current?.updateActiveObjectProperty('stroke', e.target.value)} />
                                        </label>
                                        <input type="range" className="flex-1 accent-violet-500 cursor-pointer" min="0" max="10" step="0.5" value={activeObj.strokeWidth || 0} onChange={(e) => fabricRef.current?.updateActiveObjectProperty('strokeWidth', parseFloat(e.target.value))} />
                                        <span className="text-xs text-white/50 w-6">{activeObj.strokeWidth || 0}</span>
                                    </div>
                                </div>
                                {/* Shadow */}
                                <div>
                                    <div className="text-xs font-semibold text-white/70 mb-2">Drop Shadow</div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <label className="w-6 h-6 rounded-full border-2 border-white/20 hover:border-white/40 transition-colors cursor-pointer block relative overflow-hidden" style={{ backgroundColor: activeObj.shadow?.color || 'transparent' }}>
                                            <input type="color" className="absolute opacity-0 w-full h-full cursor-pointer inset-0" value={activeObj.shadow?.color || '#000000'} onChange={(e) => {
                                                const currentShadow = activeObj.shadow || { blur: 10, offsetX: 5, offsetY: 5 };
                                                fabricRef.current?.updateActiveObjectProperty('shadow', { ...currentShadow, color: e.target.value });
                                            }} />
                                        </label>
                                        <span className="text-[10px] text-white/50">Color</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-white/50 w-10">Blur</span>
                                            <input type="range" className="flex-1 accent-violet-500 cursor-pointer h-1" min="0" max="50" value={activeObj.shadow?.blur || 0} onChange={(e) => {
                                                const currentShadow = activeObj.shadow || { color: '#000000', offsetX: 5, offsetY: 5 };
                                                fabricRef.current?.updateActiveObjectProperty('shadow', { ...currentShadow, blur: parseInt(e.target.value) });
                                            }} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-white/50 w-10">Offset X</span>
                                            <input type="range" className="flex-1 accent-violet-500 cursor-pointer h-1" min="-50" max="50" value={activeObj.shadow?.offsetX || 0} onChange={(e) => {
                                                const currentShadow = activeObj.shadow || { color: '#000000', blur: 10, offsetY: 5 };
                                                fabricRef.current?.updateActiveObjectProperty('shadow', { ...currentShadow, offsetX: parseInt(e.target.value) });
                                            }} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-white/50 w-10">Offset Y</span>
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
                        <label className="w-7 h-7 rounded-lg border-2 border-white/20 hover:border-white/40 transition-colors cursor-pointer block relative overflow-hidden" style={{ backgroundColor: (activeObj.fill as string) || '#000' }} title="Shape Fill Color" aria-label="Shape Fill Color">
                            <input type="color" className="absolute opacity-0 w-full h-full cursor-pointer inset-0 default-color-picker" value={(activeObj.fill as string) || '#000000'} onChange={(e) => fabricRef.current?.updateActiveObjectProperty('fill', e.target.value)} />
                        </label>
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-white/50">Stroke</span>
                            <label className="w-6 h-6 rounded-full border-2 border-white/20 hover:border-white/40 transition-colors cursor-pointer block relative overflow-hidden" style={{ backgroundColor: (activeObj.stroke as string) || 'transparent' }} title="Stroke Color" aria-label="Stroke Color">
                                <input type="color" className="absolute opacity-0 w-full h-full cursor-pointer inset-0 default-color-picker" value={(activeObj.stroke as string) || '#000000'} onChange={(e) => fabricRef.current?.updateActiveObjectProperty('stroke', e.target.value)} />
                            </label>
                            <input type="range" className="w-16 accent-white cursor-pointer" min="0" max="20" value={activeObj.strokeWidth || 0} onChange={(e) => fabricRef.current?.updateActiveObjectProperty('strokeWidth', parseInt(e.target.value))} aria-label="Stroke Width" title="Stroke Width" />
                        </div>
                    </>
                ) : isImageSelected ? (
                    <>
                        <button onClick={handleRemoveBgMock} disabled={isRemovingBg} className="flex items-center gap-1.5 text-sm bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 px-3 py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50">
                            {isRemovingBg ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} AI Remove BG
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        <button className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-md transition-colors cursor-pointer">
                            <Crop size={14} /> Crop
                        </button>
                        <button className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-md transition-colors cursor-pointer">
                            <Layers size={14} /> Opacity
                        </button>
                    </>
                ) : activeObj ? (
                    <span className="text-xs text-white/70">Element selected</span>
                ) : (
                    <span className="text-xs text-white/30 hidden md:inline">Select an element to edit its properties</span>
                )}

                {/* Right side: warnings */}
                <div className="ml-auto flex items-center gap-2">
                    {designState.warnings.length > 0 && (
                        <div className="flex items-center gap-1.5 bg-red-500/20 text-red-300 px-3 py-1 rounded-lg text-xs font-medium border border-red-500/30">
                            <AlertTriangle size={12} /> {designState.warnings.length} Warning{designState.warnings.length > 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════ MAIN CONTENT ═══════════ */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── Icon Rail (far left) ── */}
                <nav className="w-[72px] bg-[#1e1e2e] border-r border-white/5 flex flex-col items-center py-3 gap-1 shrink-0 overflow-y-auto">
                    {[
                        { id: 'templates' as SidebarPanel, icon: <Grid size={20} />, label: 'Templates' },
                        { id: 'elements' as SidebarPanel, icon: <LayoutGrid size={20} />, label: 'Elements' },
                        { id: 'text' as SidebarPanel, icon: <Type size={20} />, label: 'Text' },
                        { id: 'brand' as SidebarPanel, icon: <Sparkles size={20} />, label: 'Brand' },
                        { id: 'uploads' as SidebarPanel, icon: <UploadCloud size={20} />, label: 'Uploads' },
                        { id: 'draw' as SidebarPanel, icon: <PenTool size={20} />, label: 'Draw' },
                        { id: 'projects' as SidebarPanel, icon: <FolderOpen size={20} />, label: 'Projects' },
                        { id: 'apps' as SidebarPanel, icon: <Blocks size={20} />, label: 'Apps' },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => togglePanel(item.id)}
                            className={`flex flex-col items-center gap-0.5 w-14 py-2.5 rounded-xl text-[10px] font-medium transition-all cursor-pointer ${activePanel === item.id ? 'bg-violet-600/20 text-violet-300' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                    <div className="flex-1" />
                    <button
                        onClick={() => togglePanel('layers')}
                        className={`flex flex-col items-center gap-0.5 w-14 py-2.5 rounded-xl text-[10px] font-medium transition-all cursor-pointer ${activePanel === 'layers' ? 'bg-violet-600/20 text-violet-300' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
                    >
                        <Layers size={20} />
                        Layers
                    </button>
                </nav>

                {/* ── Side Panel ── */}
                <div className={`relative flex transition-all duration-300 ${activePanel && !isPanelCollapsed ? 'w-[300px]' : 'w-0'} bg-[#252536] border-r border-white/5 shrink-0 overflow-hidden`}>
                    <aside className="w-[300px] flex flex-col shrink-0 overflow-hidden absolute inset-y-0 left-0">
                        {/* Text Panel */}
                        {activePanel === 'text' && (
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                    <input placeholder="Search fonts and combinations" className="w-full bg-white/10 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white/80 placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all" />
                                </div>

                                <button onClick={() => handleAddText()} className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-lg shadow-violet-500/20 cursor-pointer">
                                    <Type size={18} /> Add a text box
                                </button>

                                <button className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer">
                                    <Wand2 size={16} className="text-violet-400" /> Magic Write
                                </button>



                                <p className="text-[11px] text-white/30 uppercase tracking-wider font-semibold mt-6 mb-2">Default text styles</p>

                                <div className="space-y-2">
                                    <button onClick={() => handleAddText('Heading', { fontSize: 48, fontWeight: 'bold' })} className="w-full text-left px-4 py-3 bg-white text-black hover:bg-gray-100 rounded-lg border border-transparent hover:border-violet-500 transition-all cursor-pointer shadow-sm">
                                        <span className="text-lg font-bold">Add a heading</span>
                                    </button>
                                    <button onClick={() => handleAddText('Subheading', { fontSize: 32, fontWeight: 600 })} className="w-full text-left px-4 py-3 bg-white text-black hover:bg-gray-100 rounded-lg border border-transparent hover:border-violet-500 transition-all cursor-pointer shadow-sm">
                                        <span className="text-sm font-semibold">Add a subheading</span>
                                    </button>
                                    <button onClick={() => handleAddText('Body text', { fontSize: 24, fontWeight: 'normal' })} className="w-full text-left px-4 py-3 bg-white text-black hover:bg-gray-100 rounded-lg border border-transparent hover:border-violet-500 transition-all cursor-pointer shadow-sm">
                                        <span className="text-xs">Add a little bit of body text</span>
                                    </button>
                                </div>

                                <p className="text-[11px] text-white/30 uppercase tracking-wider font-semibold mt-6 mb-2">Dynamic text</p>
                                <button className="w-full flex items-center gap-3 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-colors cursor-pointer group">
                                    <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-amber-500 rounded flex items-center justify-center text-white/90 text-xs font-bold ring-1 ring-white/10">
                                        [1]
                                    </div>
                                    <span className="text-sm font-semibold text-white/90 group-hover:text-white">Page numbers</span>
                                </button>

                                <div className="flex items-center justify-between mt-6 mb-2">
                                    <p className="text-[11px] text-white/30 uppercase tracking-wider font-semibold">Apps</p>
                                    <button className="text-[10px] text-white/50 hover:text-white font-medium">See all</button>
                                </div>

                                <div className="grid grid-cols-3 gap-2 pb-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="aspect-square bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-lg border border-white/10 flex items-center justify-center cursor-pointer hover:border-white/30 transition-colors">
                                            <Sparkles size={16} className="text-white/40" />
                                        </div>
                                    ))}
                                </div>

                                <p className="text-[11px] text-white/30 uppercase tracking-wider font-semibold mt-2 mb-2 border-t border-white/5 pt-4">Font combinations</p>
                                {[
                                    { title: 'Impact', sub: 'Bold & Industrial', ff: 'impact' },
                                    { title: 'Georgia', sub: 'Classic & Elegant', ff: 'georgia' },
                                    { title: 'Courier', sub: 'Monospace Code', ff: 'courier' },
                                    { title: 'Verdana', sub: 'Clean & Modern', ff: 'verdana' },
                                ].map(f => (
                                    <button key={f.ff} onClick={() => fabricRef.current?.updateFontFamily(f.ff)} className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-colors cursor-pointer group">
                                        <span className="text-base font-bold text-white/80 group-hover:text-white" style={{ fontFamily: f.ff }}>{f.title}</span>
                                        <span className="block text-[11px] text-white/30 mt-0.5">{f.sub}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Uploads Panel */}
                        {activePanel === 'uploads' && (
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                <div className="relative">
                                    <button className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-lg font-semibold text-sm transition-colors cursor-pointer relative overflow-hidden shadow-lg shadow-violet-500/20">
                                        <UploadCloud size={18} /> Upload files
                                        <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </button>
                                </div>
                                {designState.sessionAssets.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <ImageIcon size={40} className="text-white/10 mb-3" />
                                        <p className="text-sm text-white/40 font-medium">No images uploaded</p>
                                        <p className="text-xs text-white/20 mt-1">Drag files here or click Upload</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {designState.sessionAssets.map(asset => (
                                            <div key={asset.id} onClick={() => fabricRef.current?.addImage(asset.proxyUrl, crypto.randomUUID())} className="relative group aspect-square bg-white/5 rounded-lg overflow-hidden border border-white/5 hover:border-violet-500/50 transition-all cursor-pointer">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={asset.proxyUrl} alt="Upload" className="w-full h-full object-cover" />
                                                {asset.status === 'uploading' && (
                                                    <div className="absolute inset-x-0 bottom-0 bg-black/70 backdrop-blur p-2">
                                                        <div className="w-full bg-white/20 rounded-full h-1">
                                                            <div className="bg-violet-500 h-1 rounded-full transition-all duration-300" style={{ width: `${asset.progress}%` }} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Elements Panel */}
                        {activePanel === 'elements' && (
                            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                <div className="relative sticky top-0 z-10 bg-[#252627] pb-2">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 mt-[-4px] text-white/30" />
                                    <input placeholder="Search elements" className="w-full bg-white/10 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white/80 placeholder-white/30 focus:outline-none focus:border-violet-500/50 transition-all" />
                                </div>

                                {/* Recently Used */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[11px] text-white/80 uppercase tracking-wider font-semibold flex items-center gap-1"><Clock size={12} /> Recently used</p>
                                        <button className="text-[11px] font-semibold text-white/40 hover:text-white transition-colors cursor-pointer">See all</button>
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                        {['□', '○', '△'].map((s, i) => (
                                            <div key={i} className="shrink-0 w-16 h-16 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 flex items-center justify-center text-2xl text-white/40 transition-colors cursor-pointer">{s}</div>
                                        ))}
                                    </div>
                                </div>

                                {/* Shapes & Lines */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[11px] text-white/80 uppercase tracking-wider font-semibold">Shapes & Lines</p>
                                        <button className="text-[11px] font-semibold text-white/40 hover:text-white transition-colors cursor-pointer">See all</button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button onClick={() => fabricRef.current?.addShape('rect', brandConfig?.colors.primary)} className="aspect-square bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 flex items-center justify-center text-2xl text-white/40 hover:text-white/70 transition-all cursor-pointer">□</button>
                                        <button onClick={() => fabricRef.current?.addShape('circle', brandConfig?.colors.primary)} className="aspect-square bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 flex items-center justify-center text-2xl text-white/40 hover:text-white/70 transition-all cursor-pointer">○</button>
                                        <button onClick={() => fabricRef.current?.addShape('triangle', brandConfig?.colors.primary)} className="aspect-square bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 flex items-center justify-center text-2xl text-white/40 hover:text-white/70 transition-all cursor-pointer">△</button>
                                        <button onClick={() => fabricRef.current?.addShape('star', brandConfig?.colors.primary)} className="aspect-square bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 flex items-center justify-center text-2xl text-white/40 hover:text-white/70 transition-all cursor-pointer">☆</button>
                                        <button onClick={() => fabricRef.current?.addShape('hex', brandConfig?.colors.primary)} className="aspect-square bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 flex items-center justify-center text-2xl text-white/40 hover:text-white/70 transition-all cursor-pointer">⬡</button>
                                        <button onClick={() => fabricRef.current?.addShape('diamond', brandConfig?.colors.primary)} className="aspect-square bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 flex items-center justify-center text-2xl text-white/40 hover:text-white/70 transition-all cursor-pointer">◇</button>
                                    </div>
                                </div>

                                {/* Graphics */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[11px] text-white/80 uppercase tracking-wider font-semibold flex items-center gap-1"><Sparkles size={12} /> Graphics</p>
                                        <button className="text-[11px] font-semibold text-white/40 hover:text-white transition-colors cursor-pointer">See all</button>
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                        {['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&q=80', 'https://images.unsplash.com/photo-1557683316-973673baf926?w=200&q=80', 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80', 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=200&q=80'].map((src, i) => (
                                            <div key={i} className="shrink-0 w-20 h-20 rounded-lg border border-white/5 overflow-hidden transition-all cursor-pointer group hover:border-violet-500/50 relative">
                                                <img src={src} alt="Graphic" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Stickers */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[11px] text-white/80 uppercase tracking-wider font-semibold flex items-center gap-1"><Sticker size={12} /> Stickers</p>
                                        <button className="text-[11px] font-semibold text-white/40 hover:text-white transition-colors cursor-pointer">See all</button>
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                        {['https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=200&q=80', 'https://images.unsplash.com/photo-1496667107775-680076a5b282?w=200&q=80', 'https://images.unsplash.com/photo-1554629947-334ff61d85dc?w=200&q=80', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80'].map((src, i) => (
                                            <div key={i} className="shrink-0 w-20 h-20 rounded-full border border-white/5 overflow-hidden transition-all cursor-pointer group hover:border-violet-500/50 relative">
                                                <img src={src} alt="Sticker" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Photos */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[11px] text-white/80 uppercase tracking-wider font-semibold flex items-center gap-1"><ImageIcon size={12} /> Photos</p>
                                        <button className="text-[11px] font-semibold text-white/40 hover:text-white transition-colors cursor-pointer">See all</button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&q=80', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80'].map((src, i) => (
                                            <div key={i} className="aspect-[4/3] rounded-lg border border-white/5 overflow-hidden transition-all cursor-pointer group hover:border-violet-500/50 relative">
                                                <img src={src} alt="Photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Brand Panel */}
                        {activePanel === 'brand' && (
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                <p className="text-[11px] text-white/30 uppercase tracking-wider font-semibold">Brand Theme</p>
                                {[
                                    { name: 'StickyLife', brand: 'stickylife', color: '#3b82f6' },
                                    { name: 'WallMonkeys', brand: 'wallmonkeys', color: '#f97316' },
                                    { name: 'HC Brands', brand: 'hcbrands', color: '#10b981' },
                                ].map(b => (
                                    <button key={b.brand} onClick={(e) => {
                                        e.preventDefault();
                                        const config = DynamicConfigLoader.loadConfig(b.brand);
                                        setBrandConfig(config);
                                        DynamicConfigLoader.applyThemeToDOM(config);
                                        if (fabricRef.current) {
                                            fabricRef.current.animateToTheme(config.colors.primary, config.typography.defaultFont);
                                        }
                                        window.history.pushState({}, '', `?brand=${b.brand}${isAdmin ? '&mode=admin' : ''}`);
                                    }} className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-colors cursor-pointer group">
                                        <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: b.color }} />
                                        <div className="text-left">
                                            <span className="text-sm font-semibold text-white/80 group-hover:text-white">{b.name}</span>
                                            <span className="block text-[10px] text-white/30">Apply theme</span>
                                        </div>
                                    </button>
                                ))}
                                {isAdmin && (
                                    <div className="mt-4 pt-4 border-t border-white/10">
                                        <p className="text-[11px] text-white/30 uppercase tracking-wider font-semibold mb-3 flex items-center gap-1"><Shield size={11} /> Template Mapping</p>
                                        <select onChange={(e) => fabricRef.current?.setPlaceholderKey(e.target.value)} className="w-full bg-white/10 border border-white/10 text-white/80 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50">
                                            <option value="">No Mapping</option>
                                            {['{{USER_NAME}}', '{{EMAIL}}', '{{PHONE}}', '{{COMPANY}}'].map(k => <option key={k} value={k}>{k}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Templates Panel */}
                        {activePanel === 'templates' && (
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
                                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-10 h-10 mb-2 border-2 border-dashed border-white/10 group-hover:border-violet-400/50 rounded flex items-center justify-center transition-colors relative z-10">
                                                                    <Layers size={14} className="text-white/20 group-hover:text-violet-400/80" />
                                                                </div>
                                                            )}
                                                            <span className="text-[10px] font-semibold text-white/90 group-hover:text-white leading-tight line-clamp-2 relative z-10 mt-auto">{item.name}</span>
                                                            <span className="text-[8px] text-white/50 mt-1 font-mono tracking-wider relative z-10">{item.width}×{item.height}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Draw Panel */}
                        {activePanel === 'draw' && (
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
                        )}

                        {/* Projects Panel */}
                        {activePanel === 'projects' && (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="p-4 border-b border-white/5 bg-[#252536] z-10 shrink-0">
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 mt-[-1px] text-white/30" />
                                        <input placeholder="Search your projects" className="w-full bg-white/10 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white/80 placeholder-white/30 focus:outline-none focus:border-violet-500/50 transition-all font-medium" />
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                    {/* Folders */}
                                    <div className="space-y-3">
                                        <p className="text-[11px] font-bold tracking-wider uppercase text-white/50">Folders</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['Uploads', 'Purchased', 'Starred', 'Trash'].map((folder) => (
                                                <button key={folder} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg p-3 flex flex-col items-center justify-center gap-2 transition-all group">
                                                    <FolderOpen size={24} className="text-white/40 group-hover:text-violet-400" />
                                                    <span className="text-[11px] font-semibold text-white/80 group-hover:text-white">{folder}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Recent Designs */}
                                    <div className="space-y-3">
                                        <p className="text-[11px] font-bold tracking-wider uppercase text-white/50">Recent Designs</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className="group cursor-pointer">
                                                    <div className="aspect-video bg-white/5 border border-white/5 rounded-lg mb-2 overflow-hidden relative">
                                                        <div className={`absolute inset-0 opacity-20 bg-gradient-to-br from-violet-500/50 to-fuchsia-500/50`} />
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 backdrop-blur-sm transition-all">
                                                            <button className="bg-white text-black px-3 py-1.5 rounded-md text-xs font-bold">Edit</button>
                                                        </div>
                                                    </div>
                                                    <p className="text-[11px] font-medium text-white/90">Untitled Design {i}</p>
                                                    <p className="text-[9px] text-white/50 mt-0.5">Edited {i}h ago</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Apps Panel */}
                        {activePanel === 'apps' && (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="p-4 border-b border-white/5 bg-[#252536] z-10 shrink-0">
                                    <h3 className="text-sm font-semibold text-white/90 mb-3">Discover apps</h3>
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 mt-[-1px] text-white/30" />
                                        <input placeholder="Search apps" className="w-full bg-white/10 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white/80 placeholder-white/30 focus:outline-none focus:border-violet-500/50 transition-all font-medium" />
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                    <div className="space-y-4">
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                                                    <Wand2 size={16} className="text-white" />
                                                </div>
                                                <h4 className="text-sm font-bold text-white">Generative Fill</h4>
                                            </div>
                                            <p className="text-xs text-white/60 mb-3">Describe what you want to add to the canvas.</p>
                                            <textarea
                                                value={genFillPrompt}
                                                onChange={(e) => setGenFillPrompt(e.target.value)}
                                                placeholder="E.g. A realistic red apple..."
                                                className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white placeholder-white/30 resize-none h-20 focus:outline-none focus:border-violet-500 mb-3"
                                            />
                                            <button
                                                onClick={handleGenFillMock}
                                                disabled={isGenFillActive || !genFillPrompt.trim()}
                                                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:hover:bg-violet-600 text-white font-medium py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                {isGenFillActive ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                                Generate
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Layers Panel */}
                        {activePanel === 'layers' && (
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
                        )}
                    </aside>
                </div>

                {/* Collapse Handle */}
                {activePanel && (
                    <div className="relative z-10 flex items-center shrink-0 w-0">
                        <button
                            onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                            className="absolute left-0 w-5 h-10 bg-[#252536] border border-y-white/10 border-r-white/10 border-l-transparent rounded-r-[10px] flex items-center justify-center text-white/40 hover:text-white transition-colors shadow-[2px_0_8px_rgba(0,0,0,0.2)] cursor-pointer translate-x-[-1px]"
                        >
                            <ChevronRight size={14} className={`transition-transform duration-300 ${!isPanelCollapsed ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                )}

                {/* ── Canvas Area ── */}
                <main className="flex-1 flex flex-col bg-[#323247] overflow-hidden relative">

                    {/* Canvas viewport */}
                    <div
                        className="flex-1 flex items-center justify-center overflow-hidden p-8 relative"
                        onClick={(e) => {
                            if (e.target === e.currentTarget && fabricRef.current) {
                                fabricRef.current.canvas.discardActiveObject();
                                fabricRef.current.canvas.requestRenderAll();
                            }
                        }}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleFileUpload(e);
                        }}
                    >
                        <div className="relative bg-white rounded shadow-2xl shadow-black/40 inline-flex shrink-0">
                            {/* Floating HUD anchored locally to the canvas container */}
                            {(() => {
                                const activeObj = designState.activeObjectId ? fabricRef.current?.canvas.getObjects().find((o: any) => o.id === designState.activeObjectId) as any : null;
                                const isTextSelected = activeObj?.type === 'text' || activeObj?.type === 'textbox' || activeObj?.type === 'i-text';
                                const isShapeSelected = activeObj?.type === 'rect' || activeObj?.type === 'circle' || activeObj?.type === 'triangle';

                                return designState.activeObjectId && designState.activeObjectBox && activeObj && (
                                    <div
                                        className="absolute z-50 flex items-center gap-1.5 px-3 py-2 bg-white text-gray-800 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-black/5 rounded-[10px] pointer-events-auto transition-transform"
                                        style={{
                                            left: designState.activeObjectBox.left + (designState.activeObjectBox.width / 2),
                                            top: designState.activeObjectBox.top < 60
                                                ? designState.activeObjectBox.top + designState.activeObjectBox.height + 20
                                                : designState.activeObjectBox.top - 54,
                                            transform: 'translateX(-50%)',
                                            fontFamily: "'Inter', sans-serif"
                                        }}
                                    >
                                        {/* Dynamic Toolset based on Object Type */}
                                        {isTextSelected ? (
                                            <>
                                                <button className="flex justify-between items-center w-24 px-2 py-1.5 hover:bg-black/5 rounded text-xs font-semibold cursor-pointer">
                                                    <span>{activeObj?.fontFamily || 'Inter'}</span> <ChevronDown size={12} className="opacity-50" />
                                                </button>
                                                <div className="w-px h-4 bg-black/10 mx-1" />
                                                <div className="flex items-center">
                                                    <button className="p-1 hover:bg-black/5 rounded cursor-pointer" onClick={() => fabricRef.current?.updateActiveObjectProperty('fontSize', (activeObj?.fontSize || 24) - 2)}><Minus size={14} /></button>
                                                    <input type="text" value={activeObj?.fontSize || 24} readOnly className="w-8 text-center bg-transparent text-xs font-semibold outline-none pointer-events-none" />
                                                    <button className="p-1 hover:bg-black/5 rounded cursor-pointer" onClick={() => fabricRef.current?.updateActiveObjectProperty('fontSize', (activeObj?.fontSize || 24) + 2)}><Plus size={14} /></button>
                                                </div>
                                                <div className="w-px h-4 bg-black/10 mx-1" />
                                                <button onClick={() => fabricRef.current?.toggleActiveObjectProperty('fontWeight', 'bold', 'normal')} className={`p-1.5 hover:bg-black/5 rounded cursor-pointer ${activeObj?.fontWeight === 'bold' ? 'bg-black/10 text-black' : 'text-gray-500'}`}><Bold size={14} /></button>
                                                <button onClick={() => fabricRef.current?.toggleActiveObjectProperty('fontStyle', 'italic', 'normal')} className={`p-1.5 hover:bg-black/5 rounded cursor-pointer ${activeObj?.fontStyle === 'italic' ? 'bg-black/10 text-black' : 'text-gray-500'}`}><Italic size={14} /></button>
                                            </>
                                        ) : isShapeSelected ? (
                                            <>
                                                <button className="p-1.5 hover:bg-black/5 rounded cursor-pointer flex items-center justify-center">
                                                    <div className="w-5 h-5 rounded border border-black/20" style={{ backgroundColor: activeObj.fill || '#000000' }} />
                                                </button>
                                                <div className="w-px h-4 bg-black/10 mx-1" />
                                                <button className="p-1.5 text-gray-500 hover:text-black hover:bg-black/5 rounded cursor-pointer transition-colors" title="Stroke">
                                                    <Pen size={14} />
                                                </button>
                                                {activeObj.type === 'rect' && (
                                                    <button className="p-1.5 text-gray-500 hover:text-black hover:bg-black/5 rounded cursor-pointer transition-colors" title="Corner Radius">
                                                        <LayoutGrid size={14} />
                                                    </button>
                                                )}
                                                <div className="w-px h-4 bg-black/10 mx-1" />
                                                <button className="px-2 py-1.5 hover:bg-black/5 rounded text-xs font-semibold cursor-pointer flex items-center gap-1.5 text-gray-600">
                                                    <Layers size={14} /> Opacity
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={handleRemoveBgMock}
                                                    disabled={isRemovingBg}
                                                    className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-black/5 rounded text-xs font-semibold cursor-pointer text-violet-600 disabled:opacity-50"
                                                >
                                                    {isRemovingBg ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} AI Remove BG
                                                </button>
                                                <div className="w-px h-4 bg-black/10 mx-1" />
                                                <button className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-black/5 rounded text-xs font-semibold cursor-pointer">
                                                    <Crop size={14} /> Crop
                                                </button>
                                                <div className="w-px h-4 bg-black/10 mx-1" />
                                                <button className="px-2 py-1.5 hover:bg-black/5 rounded text-xs font-semibold cursor-pointer flex items-center gap-1.5">
                                                    <Layers size={14} /> Opacity
                                                </button>
                                            </>
                                        )}

                                        {/* Global Tools (Always appear for any object) */}
                                        <div className="w-px h-4 bg-black/10 mx-1" />
                                        <button onClick={() => activeObj && fabricRef.current?.toggleLock(activeObj.id)} className={`p-1.5 hover:text-black hover:bg-black/5 rounded cursor-pointer transition-colors ${activeObj?.locked ? 'text-red-500 bg-red-50' : 'text-gray-500'}`} title={activeObj?.locked ? "Unlock" : "Lock"}>
                                            {activeObj?.locked ? <Lock size={14} /> : <Unlock size={14} />}
                                        </button>
                                        <button onClick={() => fabricRef.current?.bringForward()} className="p-1.5 text-gray-500 hover:text-black hover:bg-black/5 rounded cursor-pointer transition-colors" title="Bring Forward"><ArrowUpToLine size={14} /></button>
                                        <button onClick={() => fabricRef.current?.sendBackwards()} className="p-1.5 text-gray-500 hover:text-black hover:bg-black/5 rounded cursor-pointer transition-colors" title="Send Backward"><ArrowDownToLine size={14} /></button>
                                        <button onClick={() => fabricRef.current?.copy().then(() => fabricRef.current?.paste())} className="p-1.5 text-gray-500 hover:text-black hover:bg-black/5 rounded cursor-pointer transition-colors" title="Duplicate"><Copy size={14} /></button>
                                        <button onClick={() => fabricRef.current?.deleteSelected()} className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded cursor-pointer transition-colors" title="Delete"><Trash2 size={14} /></button>

                                        {/* Production Warnings (DPI) */}
                                        {designState.warnings.some(w => w.objectId === designState.activeObjectId) && (
                                            <>
                                                <div className="w-px h-4 bg-black/10 mx-1" />
                                                <div className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold border border-red-200 uppercase tracking-widest shadow-sm">
                                                    <AlertTriangle size={10} className="animate-pulse" /> Warning
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Safe zone */}
                            <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-pink-400/0 hover:border-pink-400/30 transition-colors z-[40] m-[20px] rounded-sm" />
                            <canvas ref={canvasRef} id={canvasId.current} />
                        </div>
                    </div>

                    {/* Bottom bar (Canva style) */}
                    <div className="h-[48px] bg-[#1e1e2e] border-t border-white/5 flex items-center px-4 shrink-0 justify-between">
                        {/* Left: Notes & Timer */}
                        <div className="flex items-center gap-4">
                            <button className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors cursor-pointer">
                                <AlignLeft size={14} /> Notes
                            </button>
                            <button className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors cursor-pointer">
                                <div className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center"><Minus size={6} className="rotate-90" /></div> Timer
                            </button>
                        </div>

                        {/* Center: Slide/Page Thumbnails */}
                        <div className="flex items-center gap-4 absolute left-1/2 -translate-x-1/2">
                            <div className="h-8 w-12 bg-white rounded flex items-center justify-center text-[10px] text-black font-semibold shadow-sm border-2 border-violet-500 cursor-pointer" aria-label="Current Page" title="Current Page">
                                1
                            </div>
                            <button disabled={true} className="h-8 px-2 bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center text-white/50 transition-colors" aria-label="Add Page" title="Add Page">
                                <Plus size={14} /> <ChevronRight size={14} className="rotate-90 ml-1 opacity-50" />
                            </button>
                        </div>

                        {/* Right: Zoom slider, Grid view, Fullscreen */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="range"
                                    min="10"
                                    max="500"
                                    value={zoom}
                                    onChange={(e) => {
                                        const z = parseInt(e.target.value);
                                        setZoom(z);
                                        // Update actual canvas + DOM dimensions
                                        if (fabricRef.current && (fabricRef.current as any).setManualZoom) {
                                            (fabricRef.current as any).setManualZoom(z);
                                        } else {
                                            fabricRef.current?.canvas.setZoom(z / 100);
                                            fabricRef.current?.canvas.requestRenderAll();
                                        }
                                    }}
                                    className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                                    aria-label="Zoom Level"
                                    title="Zoom Level"
                                />
                                <span className="text-xs text-white/70 min-w-[32px]">{zoom}%</span>
                            </div>
                            <div className="w-px h-4 bg-white/10" />
                            <div className="flex items-center gap-2 text-xs text-white/50">
                                <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded cursor-pointer hover:bg-white/10 hover:text-white transition-colors" aria-label="Page List" title="Page List">
                                    <LayoutGrid size={14} /> Pages 1 / 1
                                </span>
                                <button className="p-1.5 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer" aria-label="Grid View" title="Grid View"><LayoutGrid size={14} /></button>
                                <button className="p-1.5 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer" aria-label="Fullscreen View" title="Fullscreen View"><Minus size={14} className="rotate-45" /></button>
                            </div>
                        </div>
                    </div>
                </main>

            </div>

            {/* ═══════════ CHECKOUT DRAWER ═══════════ */}
            {isReviewOpen && finalPayload && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200">
                    <div className="absolute inset-0" onClick={() => setIsReviewOpen(false)} />

                    <div className="relative bg-[#20202e] shadow-2xl w-[420px] h-full flex flex-col border-l border-white/10 animate-in slide-in-from-right duration-300">
                        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#252536]">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <ShoppingCart size={20} className="text-violet-400" /> Print Preview
                            </h2>
                            <button onClick={() => setIsReviewOpen(false)} className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
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
            )}
        </div>
    );
}
