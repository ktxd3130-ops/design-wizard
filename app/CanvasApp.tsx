'use client';

import { useEffect, useRef, useState } from 'react';
import { DynamicConfigLoader, BrandConfig } from '@/core/config';
import { FabricCanvas } from '@/core/FabricCanvas';
import { useDesignStore } from '@/core/storage';
import { useThemeStore } from '@/core/themeStore';
import {
    Type, UploadCloud, ChevronRight, LayoutGrid, Layers,
    Sparkles, PenTool, Grid, Blocks, FolderOpen,
} from 'lucide-react';
import { SessionAsset, OpenMagePayload, CanvasPage } from '@/core/types';
import { serializeForOpenMage } from '@/core/OpenMageAPI';
import { preloadPopularFonts } from '@/core/GoogleFonts';

import TopNav from './components/TopNav';
import ContextToolbar from './components/ContextToolbar';
import BottomBar from './components/BottomBar';
import CheckoutDrawer from './components/CheckoutDrawer';
import FloatingHUD from './components/FloatingHUD';
import HeaderDropdowns from './components/HeaderDropdowns';
import ContextMenu from './components/ContextMenu';
import {
    TextPanel, UploadsPanel, ElementsPanel, BrandPanel,
    TemplatesPanel, DrawPanel, ProjectsPanel, AppsPanel, LayersPanel,
    PositionPanel,
} from './components/sidebar';

type SidebarPanel = 'templates' | 'elements' | 'text' | 'brand' | 'uploads' | 'draw' | 'projects' | 'apps' | 'layers' | 'position' | null;

export default function CanvasApp() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<FabricCanvas | null>(null);
    const designState = useDesignStore((s) => s.state);
    const theme = useThemeStore((s) => s.theme);
    const [mounted, setMounted] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
    const [finalPayload, setFinalPayload] = useState<OpenMagePayload | null>(null);
    const [brandConfig, setBrandConfig] = useState<BrandConfig | null>(null);
    const [activePanel, setActivePanel] = useState<SidebarPanel>('text');
    const [isRemovingBg, setIsRemovingBg] = useState(false);
    const [templateSearchQuery, setTemplateSearchQuery] = useState('');
    const [isGenFillActive, setIsGenFillActive] = useState(false);
    const [genFillPrompt, setGenFillPrompt] = useState('');
    const [zoom, setZoom] = useState(100);
    const [activeHeaderMenu, setActiveHeaderMenu] = useState<'file' | 'resize' | 'share' | 'analytics' | null>(null);
    const canvasId = useRef(`design-canvas-${Math.random().toString(36).substr(2, 9)}`);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

    // Drawing State
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushType, setBrushType] = useState('marker');
    const [brushColor, setBrushColor] = useState('#8b5cf6');
    const [brushWidth, setBrushWidth] = useState(12);

    // ── Lifecycle ───────────────────────────────────────────────
    useEffect(() => {
        setMounted(true);
        preloadPopularFonts();
        const params = new URLSearchParams(window.location.search);
        const currentBrand = params.get('brand') || 'stickylife';
        const config = DynamicConfigLoader.loadConfig(currentBrand);
        setBrandConfig(config);
        DynamicConfigLoader.applyThemeToDOM(config);
        setIsAdmin(params.get('mode') === 'admin');

        const storedBrand = useDesignStore.getState().state.brandId;
        if (storedBrand && storedBrand !== currentBrand && useDesignStore.getState().state.objects.length > 0) {
            if (window.confirm(`Switching from ${storedBrand} to ${currentBrand}. Clear canvas?`)) {
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
            if (activeObj && activeObj.isEditing) return;

            if (e.key.toLowerCase() === 't' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); handleAddText(); }
            else if (e.key.toLowerCase() === 'r' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); fabricRef.current?.addShape('rect'); }
            else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); fabricRef.current?.deleteSelected(); }
            else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') { e.preventDefault(); fabricRef.current?.copy(); }
            else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') { e.preventDefault(); fabricRef.current?.paste(); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // ── Sync drawing state ──────────────────────────────────────
    useEffect(() => {
        if (fabricRef.current && activePanel === 'draw') {
            fabricRef.current.toggleDrawingMode(isDrawing, { type: brushType, color: brushColor, width: brushWidth });
        } else if (fabricRef.current && activePanel !== 'draw' && isDrawing) {
            setIsDrawing(false);
            fabricRef.current.toggleDrawingMode(false, { type: brushType, color: brushColor, width: brushWidth });
        }
    }, [isDrawing, brushType, brushColor, brushWidth, activePanel]);

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

    const handleRemoveBgMock = async () => {
        if (!fabricRef.current) return;
        const obj = fabricRef.current.canvas.getActiveObject() as any;
        if (!obj || obj.type !== 'image') return;

        setIsRemovingBg(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        const mockCutoutUrl = 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&auto=format&fit=crop';
        fabricRef.current.addImage(mockCutoutUrl, obj.id);
        fabricRef.current.canvas.remove(obj);
        setIsRemovingBg(false);
    };

    const handleGenFillMock = async () => {
        if (!fabricRef.current || !genFillPrompt.trim()) return;
        setIsGenFillActive(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        const generatedMockUrl = 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=500&auto=format&fit=crop';
        fabricRef.current.addImage(generatedMockUrl, crypto.randomUUID());
        setIsGenFillActive(false);
        setGenFillPrompt('');
    };

    // ── Multi-Page Handlers ─────────────────────────────────────
    const handleSwitchPage = async (index: number) => {
        if (!fabricRef.current) return;
        const currentPages = [...designState.pages];
        const currentIndex = designState.currentPageIndex || 0;

        // Save current page state
        const currentJSON = await fabricRef.current.saveCurrentPageState();
        const currentPreview = designState.preview;

        if (currentPages[currentIndex]) {
            currentPages[currentIndex] = {
                ...currentPages[currentIndex],
                canvasJSON: currentJSON,
                preview: currentPreview,
            };
        }

        // Load target page
        if (currentPages[index] && currentPages[index].canvasJSON) {
            await fabricRef.current.loadPageState(currentPages[index].canvasJSON);
        }

        useDesignStore.getState().syncCanvasState({
            pages: currentPages,
            currentPageIndex: index
        });
    };

    const handleAddPage = async () => {
        if (!fabricRef.current) return;
        const currentPages = [...designState.pages];
        const currentIndex = designState.currentPageIndex || 0;

        // If no pages exist yet, save the current canvas as page 0
        if (currentPages.length === 0) {
            const json = await fabricRef.current.saveCurrentPageState();
            currentPages.push({
                id: crypto.randomUUID(),
                label: 'Page 1',
                canvasJSON: json,
                preview: designState.preview,
            });
        } else {
            // Save current page
            const currentJSON = await fabricRef.current.saveCurrentPageState();
            if (currentPages[currentIndex]) {
                currentPages[currentIndex] = {
                    ...currentPages[currentIndex],
                    canvasJSON: currentJSON,
                    preview: designState.preview,
                };
            }
        }

        // Add new blank page
        const newPage: CanvasPage = {
            id: crypto.randomUUID(),
            label: `Page ${currentPages.length + 1}`,
            canvasJSON: '',
            preview: null,
        };
        currentPages.push(newPage);

        // Switch to new page
        fabricRef.current.clearCanvas();

        useDesignStore.getState().syncCanvasState({
            pages: currentPages,
            currentPageIndex: currentPages.length - 1,
        });
    };

    const handleDuplicatePage = async (index: number) => {
        if (!fabricRef.current) return;
        const currentPages = [...designState.pages];
        const currentIndex = designState.currentPageIndex || 0;

        // Save current page first
        const currentJSON = await fabricRef.current.saveCurrentPageState();
        if (currentPages[currentIndex]) {
            currentPages[currentIndex] = {
                ...currentPages[currentIndex],
                canvasJSON: currentJSON,
                preview: designState.preview,
            };
        }

        const source = currentPages[index];
        if (!source) return;

        const duplicate: CanvasPage = {
            id: crypto.randomUUID(),
            label: `${source.label} (copy)`,
            canvasJSON: source.canvasJSON,
            preview: source.preview,
        };

        currentPages.splice(index + 1, 0, duplicate);

        // Switch to duplicated page
        await fabricRef.current.loadPageState(duplicate.canvasJSON);

        useDesignStore.getState().syncCanvasState({
            pages: currentPages,
            currentPageIndex: index + 1,
        });
    };

    const handleDeletePage = async (index: number) => {
        if (!fabricRef.current) return;
        const currentPages = [...designState.pages];
        if (currentPages.length <= 1) return;

        currentPages.splice(index, 1);
        const newIndex = Math.min(index, currentPages.length - 1);

        // Load the new current page
        if (currentPages[newIndex] && currentPages[newIndex].canvasJSON) {
            await fabricRef.current.loadPageState(currentPages[newIndex].canvasJSON);
        }

        useDesignStore.getState().syncCanvasState({
            pages: currentPages,
            currentPageIndex: newIndex,
        });
    };

    if (!mounted) return null;

    // ── Sidebar nav items ───────────────────────────────────────
    const sidebarItems = [
        { id: 'templates' as SidebarPanel, icon: <Grid size={20} />, label: 'Templates' },
        { id: 'elements' as SidebarPanel, icon: <LayoutGrid size={20} />, label: 'Elements' },
        { id: 'text' as SidebarPanel, icon: <Type size={20} />, label: 'Text' },
        { id: 'brand' as SidebarPanel, icon: <Sparkles size={20} />, label: 'Brand' },
        { id: 'uploads' as SidebarPanel, icon: <UploadCloud size={20} />, label: 'Uploads' },
        { id: 'draw' as SidebarPanel, icon: <PenTool size={20} />, label: 'Draw' },
        { id: 'projects' as SidebarPanel, icon: <FolderOpen size={20} />, label: 'Projects' },
        { id: 'apps' as SidebarPanel, icon: <Blocks size={20} />, label: 'Apps' },
    ];

    return (
        <div data-theme={theme} className="flex flex-col h-screen bg-[var(--surface-1)] text-[var(--ui-100)] overflow-hidden" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

            {/* Top Navigation */}
            <TopNav
                fabricRef={fabricRef}
                brandConfig={brandConfig}
                designState={designState}
                isAdmin={isAdmin}
                activeHeaderMenu={activeHeaderMenu}
                setActiveHeaderMenu={setActiveHeaderMenu}
                onReviewClick={handleReviewClick}
            />

            {/* Header Dropdown Menus */}
            <HeaderDropdowns
                activeHeaderMenu={activeHeaderMenu}
                setActiveHeaderMenu={setActiveHeaderMenu}
                fabricRef={fabricRef}
                designState={designState}
                isAdmin={isAdmin}
            />

            {/* Context Toolbar */}
            <ContextToolbar
                fabricRef={fabricRef}
                designState={designState}
                brandConfig={brandConfig}
                isAdmin={isAdmin}
                isRemovingBg={isRemovingBg}
                onRemoveBg={handleRemoveBgMock}
                activePanel={activePanel}
                setActivePanel={setActivePanel}
            />

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">

                {/* Icon Rail */}
                <nav className="w-[76px] bg-[var(--surface-1)] border-r border-[var(--ui-5)] flex flex-col items-center py-4 gap-3 shrink-0 overflow-y-auto">
                    {sidebarItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => togglePanel(item.id)}
                            className={`flex flex-col items-center gap-1 w-[56px] py-3 rounded-xl text-[10px] font-medium transition-all cursor-pointer ${activePanel === item.id ? 'bg-violet-600/20 text-violet-300' : 'text-[var(--ui-40)] hover:text-[var(--ui-70)] hover:bg-[var(--ui-5)]'}`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                    <div className="flex-1" />
                    <button
                        onClick={() => togglePanel('layers')}
                        className={`flex flex-col items-center gap-1 w-[56px] py-3 rounded-xl text-[10px] font-medium transition-all cursor-pointer ${activePanel === 'layers' ? 'bg-violet-600/20 text-violet-300' : 'text-[var(--ui-40)] hover:text-[var(--ui-70)] hover:bg-[var(--ui-5)]'}`}
                    >
                        <Layers size={20} />
                        Layers
                    </button>
                </nav>

                {/* Side Panel */}
                <div className={`relative flex transition-all duration-300 ${activePanel && !isPanelCollapsed ? 'w-[340px]' : 'w-0'} bg-[var(--surface-2)] border-r border-[var(--ui-5)] shrink-0 overflow-hidden`}>
                    <aside className="w-[340px] flex flex-col shrink-0 overflow-hidden absolute inset-y-0 left-0">
                        {activePanel === 'text' && <TextPanel fabricRef={fabricRef} />}
                        {activePanel === 'uploads' && <UploadsPanel fabricRef={fabricRef} designState={designState} onFileUpload={handleFileUpload} />}
                        {activePanel === 'elements' && <ElementsPanel fabricRef={fabricRef} brandConfig={brandConfig} />}
                        {activePanel === 'brand' && <BrandPanel fabricRef={fabricRef} brandConfig={brandConfig} setBrandConfig={setBrandConfig} isAdmin={isAdmin} />}
                        {activePanel === 'templates' && <TemplatesPanel fabricRef={fabricRef} templateSearchQuery={templateSearchQuery} setTemplateSearchQuery={setTemplateSearchQuery} />}
                        {activePanel === 'draw' && <DrawPanel isDrawing={isDrawing} setIsDrawing={setIsDrawing} brushType={brushType} setBrushType={setBrushType} brushColor={brushColor} setBrushColor={setBrushColor} brushWidth={brushWidth} setBrushWidth={setBrushWidth} />}
                        {activePanel === 'projects' && <ProjectsPanel />}
                        {activePanel === 'apps' && <AppsPanel fabricRef={fabricRef} genFillPrompt={genFillPrompt} setGenFillPrompt={setGenFillPrompt} isGenFillActive={isGenFillActive} onGenFill={handleGenFillMock} />}
                        {activePanel === 'layers' && <LayersPanel designState={designState} fabricRef={fabricRef} />}
                        {activePanel === 'position' && <PositionPanel fabricRef={fabricRef} designState={designState} />}
                    </aside>
                </div>

                {/* Collapse Handle */}
                {activePanel && (
                    <div className="relative z-10 flex items-center shrink-0 w-0">
                        <button
                            onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                            className="absolute left-0 w-5 h-10 bg-[var(--surface-2)] border border-y-[var(--ui-10)] border-r-[var(--ui-10)] border-l-transparent rounded-r-[10px] flex items-center justify-center text-[var(--ui-40)] hover:text-[var(--ui-100)] transition-colors shadow-[2px_0_8px_rgba(0,0,0,0.2)] cursor-pointer translate-x-[-1px]"
                        >
                            <ChevronRight size={14} className={`transition-transform duration-300 ${!isPanelCollapsed ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                )}

                {/* Canvas Area */}
                <main className="flex-1 flex flex-col bg-[var(--surface-canvas)] overflow-hidden relative">
                    <div
                        className="flex-1 flex items-center justify-center overflow-hidden p-8 relative"
                        onClick={(e) => {
                            if (e.target === e.currentTarget && fabricRef.current) {
                                fabricRef.current.canvas.discardActiveObject();
                                fabricRef.current.canvas.requestRenderAll();
                            }
                            setContextMenu(null);
                        }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            const activeObj = fabricRef.current?.canvas.getActiveObject() as any;
                            setContextMenu({ x: e.clientX, y: e.clientY });
                        }}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add('ring-2', 'ring-violet-500/50'); }}
                        onDragLeave={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-violet-500/50'); }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.classList.remove('ring-2', 'ring-violet-500/50');

                            const dragType = e.dataTransfer.getData('application/design-wizard-type');
                            const dragData = e.dataTransfer.getData('application/design-wizard-data');

                            if (dragType === 'shape') {
                                fabricRef.current?.addShape(dragData as any, brandConfig?.colors.primary);
                            } else if (dragType === 'text') {
                                fabricRef.current?.addText(dragData || 'Your text here');
                            } else if (dragType === 'image') {
                                fabricRef.current?.addImage(dragData, crypto.randomUUID());
                            } else if (dragType === 'template') {
                                // Template drag handled separately
                            } else {
                                // Fall back to file upload
                                handleFileUpload(e);
                            }
                        }}
                    >
                        <div className="relative bg-white rounded shadow-2xl shadow-black/40 inline-flex shrink-0">
                            <FloatingHUD
                                fabricRef={fabricRef}
                                designState={designState}
                                isRemovingBg={isRemovingBg}
                                onRemoveBg={handleRemoveBgMock}
                            />
                            <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-pink-400/0 hover:border-pink-400/30 transition-colors z-[40] m-[20px] rounded-sm" />
                            <canvas ref={canvasRef} id={canvasId.current} />
                        </div>
                    </div>

                    <BottomBar
                        fabricRef={fabricRef}
                        zoom={zoom}
                        setZoom={setZoom}
                        designState={designState}
                        onSwitchPage={handleSwitchPage}
                        onAddPage={handleAddPage}
                        onDuplicatePage={handleDuplicatePage}
                        onDeletePage={handleDeletePage}
                    />

                    {/* Right-Click Context Menu */}
                    {contextMenu && (
                        <ContextMenu
                            x={contextMenu.x}
                            y={contextMenu.y}
                            fabricRef={fabricRef}
                            onClose={() => setContextMenu(null)}
                            hasSelection={!!designState.activeObjectId}
                            isGroup={(() => { const obj = fabricRef.current?.canvas.getActiveObject(); return obj?.type === 'group'; })()}
                            isLocked={(() => { const obj = fabricRef.current?.canvas.getActiveObject() as any; return !!obj?.locked; })()}
                        />
                    )}
                </main>

            </div>

            {/* Checkout Drawer */}
            <CheckoutDrawer
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
                finalPayload={finalPayload}
                designState={designState}
            />
        </div>
    );
}
