import * as fabric from 'fabric';
import { BaseFabricObject } from './types';
import { useDesignStore } from './storage';
import { DPICalculator } from './ProductionUtils';
import { MockAIService } from './services/MockAI';
import { PlaceholderService } from './services/PlaceholderService';
import { SnappingEngine, HistoryManager, DrawingMode } from './canvas';
import { loadGoogleFont } from './GoogleFonts';

export class FabricCanvas {
    public canvas: fabric.Canvas;

    // Extracted modules (composition)
    private snappingEngine: SnappingEngine;
    private historyManager: HistoryManager;
    private drawingMode: DrawingMode;

    // Touch & Panning state
    private isSpacePan = false;
    private isDragging = false;
    private lastPosX = 0;
    private lastPosY = 0;

    // Architect: Performance Loop State
    private syncPending = false;
    private rafId = 0;

    // 1:1 Scale Dimension Tracking
    public baseWidth = 800;
    public baseHeight = 600;

    constructor(canvasElement: HTMLCanvasElement) {
        // Architect: Style global selection boundaries to match brand
        fabric.Object.prototype.set({
            borderColor: '#8b5cf6', // brand violet
            cornerColor: '#ffffff',
            cornerStrokeColor: '#8b5cf6',
            cornerSize: 10,
            cornerStyle: 'circle',
            transparentCorners: false,
            padding: 4
        });

        this.canvas = new fabric.Canvas(canvasElement, {
            width: 800,
            height: 600,
            backgroundColor: '#ffffff',
            preserveObjectStacking: true,
        });

        // Initialise extracted modules
        this.snappingEngine = new SnappingEngine(this.canvas);
        this.historyManager = new HistoryManager(this.canvas);
        this.drawingMode = new DrawingMode(this.canvas);

        // Wire drawing-mode sync callback
        this.drawingMode.onPathCreated(() => this.syncToStore());

        // Architect: History listeners (delegated to HistoryManager)
        this.historyManager.attach();

        // Architect: Integrate types.ts into object:moving and object:scaling
        this.canvas.on('object:moving', this.handleObjectModification.bind(this));
        this.canvas.on('object:scaling', this.handleObjectModification.bind(this));

        // Architect: Shrink-to-Fit listener for Textboxes
        this.canvas.on('object:scaling', (e) => {
            const target = e.target;
            if (target) {
                target.set({
                    left: Math.round(target.left || 0),
                    top: Math.round(target.top || 0)
                });
            }

            if (target && target.type === 'textbox' && (target as any).autoSize) {
                const textbox = target as fabric.Textbox;

                // When scaled out, font size goes up, scale resets to 1
                textbox.fontSize = (textbox.fontSize || 24) * textbox.scaleX;
                textbox.width = (textbox.width || 100) * textbox.scaleX;

                textbox.scaleX = 1;
                textbox.scaleY = 1;

                this.canvas.renderAll();
            }
            this.updateActiveObjectBox();
        });

        this.canvas.on('object:moving', (e) => {
            const target = e.target;
            if (target) {
                target.set({
                    left: Math.round(target.left || 0),
                    top: Math.round(target.top || 0)
                });
            }
            this.updateActiveObjectBox();
        });

        this.canvas.on('mouse:down', (opt) => {
            if (this.isSpacePan && opt.e) {
                this.isDragging = true;
                const e = opt.e as MouseEvent | TouchEvent;
                this.lastPosX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
                this.lastPosY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
                this.canvas.defaultCursor = 'grabbing';
                this.canvas.setCursor('grabbing');
                this.canvas.selection = false;
            }
        });

        this.canvas.on('mouse:move', (opt) => {
            if (this.isDragging && this.isSpacePan && opt.e) {
                const e = opt.e as MouseEvent | TouchEvent;
                const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
                const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;

                const vpt = this.canvas.viewportTransform;
                if (vpt) {
                    vpt[4] += clientX - this.lastPosX;
                    vpt[5] += clientY - this.lastPosY;
                    this.canvas.requestRenderAll();
                    this.lastPosX = clientX;
                    this.lastPosY = clientY;
                }
            }
        });

        this.canvas.on('mouse:up', () => {
            this.isDragging = false;
            this.canvas.selection = true;
            this.snappingEngine.clearGuides();
            this.canvas.renderAll();
        });

        // Architect: Global Hotkey Manager
        this.setupGlobalHotkeys();

        // Architect: Enable Native Touch Gestures (Pinch/Zoom)
        this.canvas.on('mouse:wheel', (opt) => {
            const delta = opt.e.deltaY;
            let zoom = this.canvas.getZoom();
            zoom *= 0.999 ** delta;
            // Cap zoom strictly
            if (zoom > 5) zoom = 5;
            if (zoom < 0.1) zoom = 0.1;

            this.canvas.setZoom(zoom);

            // Native DOM Scale Sync ("The White Box" Zoom)
            this.canvas.setDimensions({
                width: this.baseWidth * zoom,
                height: this.baseHeight * zoom
            });

            // Prevent objects from sliding off the white background
            const vpt = this.canvas.viewportTransform;
            if (vpt) {
                vpt[4] = 0;
                vpt[5] = 0;
            }

            this.canvas.requestRenderAll();
            opt.e.preventDefault();
            opt.e.stopPropagation();
        });

        // Architect: Mobile Multitouch (Pinch to Zoom)
        // @ts-ignore - Fabric.js types don't officially include touch events without augmentation
        this.canvas.on('touch:gesture', (opt: any) => {
            if (opt.e.touches && opt.e.touches.length === 2) {
                let zoom = this.canvas.getZoom();
                zoom *= opt.scale;

                if (zoom > 5) zoom = 5;
                if (zoom < 0.1) zoom = 0.1;

                this.canvas.setZoom(zoom);
                this.canvas.setDimensions({
                    width: this.baseWidth * zoom,
                    height: this.baseHeight * zoom
                });

                const vpt = this.canvas.viewportTransform;
                if (vpt) {
                    vpt[4] = 0;
                    vpt[5] = 0;
                }
                this.canvas.requestRenderAll();
            }
        });

        // Track touch panning for mobile devices
        // @ts-ignore - Fabric.js types don't officially include touch events without augmentation
        this.canvas.on('touch:drag', (opt: any) => {
            if (this.isDragging && opt.e.touches) {
                const e = opt.e.touches[0];
                const vpt = this.canvas.viewportTransform;
                if (vpt) {
                    vpt[4] += e.clientX - this.lastPosX;
                    vpt[5] += e.clientY - this.lastPosY;
                    this.canvas.requestRenderAll();
                    this.lastPosX = e.clientX;
                    this.lastPosY = e.clientY;
                }
            }
        });

        // Architect: Native Inline Editing
        this.canvas.on('mouse:dblclick', (opt) => {
            const target = opt.target as any;
            if (target && (target.type === 'i-text' || target.type === 'textbox' || target.type === 'text')) {
                if (target.enterEditing) {
                    target.enterEditing();
                    target.selectAll();
                    this.canvas.requestRenderAll();
                }
            }
        });

        // UI-UX Agent QA: Track active object selection for Bottom Sheet routing
        this.canvas.on('selection:created', (e) => this.handleSelection(e));
        this.canvas.on('selection:updated', (e) => this.handleSelection(e));
        this.canvas.on('selection:cleared', () => {
            useDesignStore.getState().syncCanvasState({ activeObjectId: null });
        });

        this.loadInitialState();
    }

    private setupGlobalHotkeys() {
        if (typeof window === 'undefined') return;

        document.addEventListener('keydown', (e) => {
            const target = e.target as HTMLElement;
            const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

            // Allow Spacebar panning regardless of input focus IF the user is explicitly forcing drag
            if (e.code === 'Space' && !isInput) {
                this.isSpacePan = true;
                this.canvas.defaultCursor = 'grab';
                e.preventDefault();
                return;
            }

            if (isInput) return; // Ignore hotkeys when typing

            const isCmdCtrl = e.metaKey || e.ctrlKey;
            const activeObj = this.canvas.getActiveObject();

            switch (e.key.toLowerCase()) {
                case 't':
                    if (!isCmdCtrl) {
                        this.addText();
                        e.preventDefault();
                    }
                    break;
                case 'r':
                    if (!isCmdCtrl) {
                        this.addShape('rect');
                        e.preventDefault();
                    }
                    break;
                case 'o':
                    if (!isCmdCtrl) {
                        this.addShape('circle');
                        e.preventDefault();
                    }
                    break;
                case 'delete':
                case 'backspace':
                    if (activeObj && !(activeObj as any).isEditing) {
                        this.deleteSelected();
                        e.preventDefault();
                    }
                    break;
                case 'd':
                    if (isCmdCtrl) {
                        this.copy().then(() => this.paste());
                        e.preventDefault();
                    }
                    break;
                case 'g':
                    if (isCmdCtrl) {
                        if (e.shiftKey) {
                            // Ungroup mock (Fabric 6 handles grouping differently, omitting for MVP unless requested)
                        } else {
                            // Group mock
                        }
                        e.preventDefault();
                    }
                    break;
                case 'arrowup':
                case 'arrowdown':
                case 'arrowleft':
                case 'arrowright':
                    if (activeObj && !(activeObj as any).isEditing) {
                        const step = e.shiftKey ? 10 : 1;
                        if (e.key.toLowerCase() === 'arrowup') activeObj.set('top', Math.round((activeObj.top as number) - step));
                        if (e.key.toLowerCase() === 'arrowdown') activeObj.set('top', Math.round((activeObj.top as number) + step));
                        if (e.key.toLowerCase() === 'arrowleft') activeObj.set('left', Math.round((activeObj.left as number) - step));
                        if (e.key.toLowerCase() === 'arrowright') activeObj.set('left', Math.round((activeObj.left as number) + step));
                        activeObj.setCoords();
                        this.canvas.requestRenderAll();
                        this.syncToStore();
                        e.preventDefault();
                    }
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                this.isSpacePan = false;
                this.canvas.defaultCursor = 'default';
            }
        });
    }

    private handleSelection(e: any) {
        const selected = e.selected?.[0];
        if (selected) {
            useDesignStore.getState().syncCanvasState({ activeObjectId: (selected as any).id });
        }
        this.updateActiveObjectBox();
    }

    private updateActiveObjectBox() {
        const activeObj = this.canvas.getActiveObject();
        if (activeObj) {
            const rect = activeObj.getBoundingRect();
            useDesignStore.getState().syncCanvasState({
                activeObjectBox: { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
            });
        } else {
            useDesignStore.getState().syncCanvasState({ activeObjectBox: null });
        }
    }

    // Guide line management delegated to SnappingEngine

    private handleObjectModification(e: any) {
        const target = e.target;
        if (!target) return;

        if (e.e && e.e.type === 'mousemove') {
            this.snappingEngine.handleSnapping(target);
        }

        // Architect QA: Eliminate sub-pixel blur post-modification
        target.set({
            left: Math.round(target.left || 0),
            top: Math.round(target.top || 0)
        });

        this.updateActiveObjectBox();

        // Ensure Production Metadata remains intact (e.g. tracking zIndex or specific types)
        // Update the Zustand store immediately so the UI is reacting in real-time (<200ms)
        this.syncToStore();
    }

    public bringForward() {
        const activeObj = this.canvas.getActiveObject();
        if (activeObj) {
            this.canvas.bringObjectForward(activeObj);
            this.canvas.requestRenderAll();
            this.syncToStore();
        }
    }

    public sendBackwards() {
        const activeObj = this.canvas.getActiveObject();
        if (activeObj) {
            this.canvas.sendObjectBackwards(activeObj);
            this.canvas.requestRenderAll();
            this.syncToStore();
        }
    }

    public resizeWorkspace(width: number, height: number) {
        this.baseWidth = width;
        this.baseHeight = height;
        this.canvas.setDimensions({ width, height });

        // Sync the new baseline to the store so the UI Property Panel updates
        useDesignStore.getState().syncCanvasState({
            canvasWidth: width,
            canvasHeight: height
        });

        // Immediately reflow the viewport so the user sees the entire new product template
        this.zoomToFit();
        this.canvas.requestRenderAll();
    }

    public async loadTemplateJSON(json: any) {
        if (!json) return;
        try {
            await this.canvas.loadFromJSON(json);
            this.canvas.requestRenderAll();
            this.syncToStore();
        } catch (err) {
            console.error("Failed to load template payload:", err);
        }
        // Initial empty state for history
        this.saveHistory();
    }

    private saveHistory() {
        this.historyManager.save();
    }

    public async undo() {
        const restored = await this.historyManager.undo();
        if (restored) this.syncToStore();
    }

    public async redo() {
        const restored = await this.historyManager.redo();
        if (restored) this.syncToStore();
    }

    public toggleLock(id: string) {
        const obj = this.canvas.getObjects().find(o => (o as any).id === id);
        if (!obj) return;

        const isLocked = !(obj as any).locked;
        (obj as any).locked = isLocked;

        // Fabric.js lock API restrictions
        obj.set({
            selectable: !isLocked,
            evented: !isLocked,
            lockMovementX: isLocked,
            lockMovementY: isLocked,
            lockScalingX: isLocked,
            lockScalingY: isLocked,
            lockRotation: isLocked
        });

        // Drop active selection if we just locked the active object
        if (isLocked && this.canvas.getActiveObject() === obj) {
            this.canvas.discardActiveObject();
        }

        this.canvas.renderAll();
        this.syncToStore();
    }

    // Snapping logic delegated to SnappingEngine

    private generateThumbnail(): string {
        // Generate a low-res data-URL for the Integrator
        // We use a small multiplier to keep the payload size small
        return this.canvas.toDataURL({
            format: 'jpeg',
            quality: 0.5,
            multiplier: 0.25
        });
    }

    private syncToStore() {
        // Generate the serialized state with strict typing
        const warnings: any[] = [];
        const safeZone = useDesignStore.getState().state.safeZoneMargin;

        const objects = this.canvas.getObjects().map((obj: any) => {
            if (obj.strokeDashArray) return null; // Ignore guide lines

            const objId = obj.id || crypto.randomUUID();
            let qualityWarning = false;

            if (obj.type === 'image') {
                qualityWarning = DPICalculator.checkLowDPI(obj.scaleX, obj.scaleY);
                if (qualityWarning) {
                    warnings.push({
                        id: crypto.randomUUID(),
                        type: 'dpi',
                        message: 'Image DPI is below 150. Print quality degraded.',
                        objectId: objId
                    });
                }
            }

            if (obj.type === 'text' || obj.type === 'textbox') {
                const legibility = DPICalculator.checkLegibility(obj.fontSize || 24, obj.fontWeight || 'normal');
                if (legibility.hasWarning) {
                    warnings.push({
                        id: crypto.randomUUID(),
                        type: 'bleed', // Repurposing bleed category or could make a new one 'legibility'
                        message: legibility.message || 'Legibility warning',
                        objectId: objId
                    });
                }
            }

            const isOutsideBleed =
                obj.left < safeZone ||
                obj.top < safeZone ||
                (obj.left + obj.getScaledWidth()) > (this.canvas.getWidth() - safeZone) ||
                (obj.top + obj.getScaledHeight()) > (this.canvas.getHeight() - safeZone);

            if (isOutsideBleed) {
                warnings.push({
                    id: crypto.randomUUID(),
                    type: 'bleed',
                    message: 'Layer is outside the safe print zone (bleed risk).',
                    objectId: objId
                });
            }

            return {
                id: objId,
                type: obj.type,
                left: obj.left,
                top: obj.top,
                width: obj.width * obj.scaleX,
                height: obj.height * obj.scaleY,
                angle: obj.angle,
                scaleX: 1, // Normalized
                scaleY: 1, // Normalized
                opacity: obj.opacity,
                zIndex: this.canvas.getObjects().indexOf(obj),
                locked: obj.locked || false,
                text: obj.text,
                fontFamily: obj.fontFamily,
                fontSize: obj.fontSize,
                fill: obj.fill,
                fontWeight: obj.fontWeight,
                textAlign: obj.textAlign,
                stroke: obj.stroke,
                strokeWidth: obj.strokeWidth,
                shadow: obj.shadow ? {
                    color: obj.shadow.color,
                    blur: obj.shadow.blur,
                    offsetX: obj.shadow.offsetX,
                    offsetY: obj.shadow.offsetY
                } : null,
                autoSize: obj.autoSize,
                isFontLoading: obj.isFontLoading,
                placeholderKey: obj.placeholderKey,
                proxyUrl: obj.proxyUrl,
                highResUrl: obj.highResUrl,
                s3Url: obj.s3Url,
                maxPrintWidth: obj.maxPrintWidth,
                maxPrintHeight: obj.maxPrintHeight,
                qualityWarning,
            } as BaseFabricObject;
        }).filter(Boolean);

        const preview = this.generateThumbnail();
        useDesignStore.getState().syncCanvasState({ objects: objects as any, warnings, preview });
    }

    private async loadInitialState() {
        // Load state from the Zustand persisted store
        const stateObjects = useDesignStore.getState().state.objects;

        for (const obj of stateObjects) {
            if (obj.type === 'text' || obj.type === 'textbox') {
                const text = new fabric.Textbox((obj as any).text || 'Text', {
                    left: obj.left,
                    top: obj.top,
                    width: obj.width,
                    fontFamily: (obj as any).fontFamily || 'sans-serif',
                    fontSize: (obj as any).fontSize || 24,
                    fill: (obj as any).fill || '#000000',
                    fontWeight: (obj as any).fontWeight || 'normal',
                    textAlign: (obj as any).textAlign || 'left',
                    stroke: (obj as any).stroke || undefined,
                    strokeWidth: (obj as any).strokeWidth || 0,
                    shadow: (obj as any).shadow ? new fabric.Shadow((obj as any).shadow) : undefined,
                    angle: obj.angle,
                    opacity: obj.opacity,
                    id: obj.id,
                    autoSize: (obj as any).autoSize,
                    placeholderKey: (obj as any).placeholderKey,
                    selectable: !obj.locked,
                    evented: !obj.locked,
                    locked: obj.locked,
                });
                this.canvas.add(text);
            } else if (obj.type === 'image' && (obj as any).proxyUrl) {
                try {
                    const img = await fabric.Image.fromURL((obj as any).proxyUrl);
                    img.set({
                        left: obj.left,
                        top: obj.top,
                        scaleX: obj.scaleX,
                        scaleY: obj.scaleY,
                        angle: obj.angle,
                        opacity: obj.opacity,
                        id: obj.id,
                        proxyUrl: (obj as any).proxyUrl,
                        highResUrl: (obj as any).highResUrl,
                        s3Url: (obj as any).s3Url,
                        selectable: !obj.locked,
                        evented: !obj.locked,
                        locked: obj.locked,
                    });
                    this.canvas.add(img);
                } catch (e) {
                    console.warn('Could not restore image:', e);
                }
            }
        }

        this.canvas.requestRenderAll();
    }

    public addText(
        textStr: string = 'Your text here',
        options: { fontSize?: number, fontWeight?: string | number } = {}
    ) {
        const text = new fabric.IText(textStr, {
            left: 100,
            top: 100,
            width: 250,
            fontFamily: 'sans-serif',
            fontSize: options.fontSize || 24,
            fontWeight: options.fontWeight || 'normal',
            fill: '#000000',
            id: crypto.randomUUID(),
            autoSize: true,
            isFontLoading: false,
        });
        this.canvas.add(text);
        this.canvas.setActiveObject(text);
        this.syncToStore();
    }

    public addShape(type: 'rect' | 'circle' | 'triangle' | 'star' | 'hex' | 'diamond', color: string = '#000000') {
        const center = this.canvas.getVpCenter();
        const baseOptions = {
            left: center.x,
            top: center.y,
            fill: color,
            id: crypto.randomUUID(),
            originX: 'center' as fabric.TOriginX,
            originY: 'center' as fabric.TOriginY,
            scaleX: 1,
            scaleY: 1
        };

        let shape: fabric.Object | null = null;

        switch (type) {
            case 'rect':
                shape = new fabric.Rect({ ...baseOptions, width: 100, height: 100, rx: 8, ry: 8 });
                break;
            case 'circle':
                shape = new fabric.Circle({ ...baseOptions, radius: 50 });
                break;
            case 'triangle':
                shape = new fabric.Triangle({ ...baseOptions, width: 100, height: 100 });
                break;
            case 'star':
                // A basic 5-point star using Polygon
                const starPoints = [
                    { x: 50, y: 0 }, { x: 61, y: 35 }, { x: 98, y: 35 }, { x: 68, y: 57 },
                    { x: 79, y: 91 }, { x: 50, y: 70 }, { x: 21, y: 91 }, { x: 32, y: 57 },
                    { x: 2, y: 35 }, { x: 39, y: 35 }
                ];
                shape = new fabric.Polygon(starPoints, { ...baseOptions });
                break;
            case 'hex':
                const hexPoints = [
                    { x: 50, y: 0 }, { x: 100, y: 25 }, { x: 100, y: 75 },
                    { x: 50, y: 100 }, { x: 0, y: 75 }, { x: 0, y: 25 }
                ];
                shape = new fabric.Polygon(hexPoints, { ...baseOptions });
                break;
            case 'diamond':
                const diamondPoints = [
                    { x: 50, y: 0 }, { x: 100, y: 50 }, { x: 50, y: 100 }, { x: 0, y: 50 }
                ];
                shape = new fabric.Polygon(diamondPoints, { ...baseOptions });
                break;
        }

        if (shape) {
            this.canvas.add(shape);
            this.canvas.setActiveObject(shape);
            this.canvas.requestRenderAll();
            this.syncToStore();
        }
    }

    public async updateFontFamily(fontFamily: string) {
        const activeObj = this.canvas.getActiveObject();
        if (!activeObj || (activeObj.type !== 'textbox' && activeObj.type !== 'i-text' && activeObj.type !== 'text')) return;

        activeObj.set('isFontLoading', true);
        this.syncToStore();

        try {
            await loadGoogleFont(fontFamily);
            activeObj.set('fontFamily', fontFamily);
            this.canvas.requestRenderAll();
        } finally {
            activeObj.set('isFontLoading', false);
            this.syncToStore();
        }
    }

    public animateToTheme(primaryColor: string, fontFamily: string) {
        const objs = this.canvas.getObjects();
        objs.forEach(obj => {
            if (obj.type === 'textbox' || obj.type === 'text') {
                obj.set('fontFamily', fontFamily);
                // For a smooth effect without a color interpolator, we set it and rely on the UI fading
                obj.set('fill', primaryColor);
            } else if (obj.type === 'path' || obj.type === 'rect' || obj.type === 'circle') {
                obj.set('fill', primaryColor);
            }
        });
        this.canvas.requestRenderAll();

        // Timeout to allow the CSS transitions to complete before taking a Zustand snapshot
        setTimeout(() => {
            this.syncToStore();
        }, 300);
    }

    public async addImage(url: string, id: string) {
        // Load image from proxy URL
        const img = await fabric.Image.fromURL(url);

        // Scale down initially so it fits on screen nicely
        img.scaleToWidth(200);
        img.set({
            left: this.canvas.getWidth() / 2 - 100,
            top: this.canvas.getHeight() / 2 - (img.getScaledHeight() / 2),
            id: id,
        });

        // Calculate max print size (Production Pre-Flight)
        const originalWidth = img.width || 0;
        const originalHeight = img.height || 0;
        const { maxWidth, maxHeight } = DPICalculator.calculateMaxPrintSize(originalWidth, originalHeight);

        // Attach strict typing constraints to the fabric object so it persists on sync
        img.set({
            proxyUrl: url,
            highResUrl: url, // For this MVP, using the same blob
            s3Url: undefined, // Will be updated by Integrator multi-stage upload
            maxPrintWidth: maxWidth,
            maxPrintHeight: maxHeight
        });

        this.canvas.add(img);
        this.canvas.setActiveObject(img);
        this.canvas.requestRenderAll();
        this.syncToStore();
    }

    public toggleDrawingMode(isDrawing: boolean, settings: { type: string, color: string, width: number }) {
        this.drawingMode.toggle(isDrawing, settings);
    }

    public updateActiveObjectProperty(key: string, value: any) {
        const activeObj = this.canvas.getActiveObject();
        if (activeObj) {
            if (key === 'shadow' && value && typeof value === 'object') {
                // Create a proper Fabric Shadow object for live preview
                const shadow = new fabric.Shadow({
                    color: value.color || '#000000',
                    blur: value.blur || 0,
                    offsetX: value.offsetX || 0,
                    offsetY: value.offsetY || 0,
                });
                activeObj.set('shadow', shadow);
            } else {
                activeObj.set(key, value);
            }
            this.canvas.requestRenderAll();
            this.syncToStore();
            this.updateActiveObjectBox(); // In case font/size changed box bounds
        }
    }

    public toggleActiveObjectProperty(key: string, onValue: any, offValue: any) {
        const activeObj = this.canvas.getActiveObject();
        if (activeObj) {
            const current = activeObj.get(key);
            activeObj.set(key, current === onValue ? offValue : onValue);
            this.canvas.requestRenderAll();
            this.syncToStore();
            this.updateActiveObjectBox();
        }
    }

    public async removeBackgroundForActiveObject() {
        const activeObj = this.canvas.getActiveObject();
        if (!activeObj || activeObj.type !== 'image') return;

        activeObj.set('isFontLoading', true); // Reusing loader meta slightly generically
        this.syncToStore();

        try {
            // Process AI swap -> Return new URL with transparent BG
            const newUrl = await MockAIService.removeBackground({
                id: crypto.randomUUID(),
                file: new File([], ''),
                proxyUrl: activeObj.get('proxyUrl') as string,
                status: 'staged',
                progress: 100
            });

            // The production requirement: swap proxyUrl, KEEP highResUrl
            // Load new image graphic to replace current fabric representation
            const newImg = await fabric.Image.fromURL(newUrl);

            // Transfer transforms
            newImg.set({
                left: activeObj.left,
                top: activeObj.top,
                scaleX: activeObj.scaleX,
                scaleY: activeObj.scaleY,
                angle: activeObj.angle,
                id: (activeObj as any).id,

                // CRITICAL: Preserve highRes for OpenMage
                proxyUrl: newUrl,
                highResUrl: activeObj.get('highResUrl'),
                s3Url: activeObj.get('s3Url'),
                maxPrintWidth: activeObj.get('maxPrintWidth'),
                maxPrintHeight: activeObj.get('maxPrintHeight')
            });

            this.canvas.insertAt(this.canvas.getObjects().indexOf(activeObj), newImg);
            this.canvas.remove(activeObj);
            this.canvas.setActiveObject(newImg);
            this.canvas.requestRenderAll();
        } finally {
            if (this.canvas.getActiveObject()) {
                this.canvas.getActiveObject()?.set('isFontLoading', false);
            }
            this.syncToStore();
        }
    }

    public async vectorizeActiveObject() {
        const activeObj = this.canvas.getActiveObject();
        if (!activeObj || activeObj.type !== 'image') return;

        activeObj.set('isFontLoading', true);
        this.syncToStore();

        try {
            const svgUrl = await MockAIService.vectorizeImage({
                id: crypto.randomUUID(),
                file: new File([], ''),
                proxyUrl: activeObj.get('proxyUrl') as string,
                status: 'staged',
                progress: 100
            });

            // Production validation notes this SVG is 'vector' / 'path' type, meaning infinite scale
            fabric.loadSVGFromURL(svgUrl, (objects: any, options: any) => {
                const newObj = fabric.util.groupSVGElements(objects, options);

                newObj.set({
                    left: activeObj.left,
                    top: activeObj.top,
                    scaleX: activeObj.scaleX,
                    scaleY: activeObj.scaleY,
                    angle: activeObj.angle,
                    id: (activeObj as any).id,
                    type: 'path', // Architect standard for infinite quality vectors
                    proxyUrl: svgUrl,
                    highResUrl: svgUrl, // High-res IS proxy now because vectors are resolution independent
                    isFontLoading: false
                });

                this.canvas.insertAt(this.canvas.getObjects().indexOf(activeObj), newObj);
                this.canvas.remove(activeObj);
                this.canvas.setActiveObject(newObj);
                this.canvas.requestRenderAll();
                this.syncToStore();
            });
        } catch {
            if (this.canvas.getActiveObject()) {
                this.canvas.getActiveObject()?.set('isFontLoading', false);
            }
            this.syncToStore();
        }
    }

    /**
     * Architect: Template Injection Method
     * Scales a pre-defined layout to perfectly fit the current dynamic CanvasDimensions representing a specific SKU
     */
    public async injectTemplate(templateJSON: any, originalTemplateWidth: number, originalTemplateHeight: number) {
        const currentWidth = this.canvas.getWidth();
        const currentHeight = this.canvas.getHeight();

        // Auto-calculate scale to fit without skewing
        const scaleX = currentWidth / originalTemplateWidth;
        const scaleY = currentHeight / originalTemplateHeight;
        const scale = Math.min(scaleX, scaleY);

        // Integrator: Auto-fill placeholder keys before rendering
        const hydratedJSON = PlaceholderService.hydrateTemplate(templateJSON);

        // Use fabric deserializer
        const enlivenedObjects = await fabric.util.enlivenObjects(hydratedJSON);

        enlivenedObjects.forEach((obj: any) => {
            // Apply responsive scale factor
            obj.scaleX = (obj.scaleX || 1) * scale;
            obj.scaleY = (obj.scaleY || 1) * scale;
            obj.left = (obj.left || 0) * scale;
            obj.top = (obj.top || 0) * scale;

            // Re-center offset if template was smaller
            const xOffset = (currentWidth - (originalTemplateWidth * scale)) / 2;
            const yOffset = (currentHeight - (originalTemplateHeight * scale)) / 2;

            obj.left += xOffset;
            obj.top += yOffset;

            this.canvas.add(obj);
        });

        this.canvas.renderAll();
        this.syncToStore();
    }

    /**
     * Architect: Mobile Viewport Resizing
     */
    public zoomToFit() {
        if (typeof window === 'undefined') return;

        const wrapper = this.canvas.getElement()?.closest('.overflow-auto');
        let availableWidth = window.innerWidth - 400; // Safe fallback
        let availableHeight = window.innerHeight - 150;

        if (wrapper) {
            // Padding gap of 96px total (48px per side)
            availableWidth = wrapper.clientWidth - 96;
            availableHeight = wrapper.clientHeight - 96;
        }

        const scaleX = availableWidth / (this.baseWidth || 1);
        const scaleY = availableHeight / (this.baseHeight || 1);

        // Use the smaller scale so it fits entirely, but don't blow it up past 1x if it's small natively
        const scale = Math.min(scaleX, scaleY, 1);

        this.canvas.setZoom(scale);

        // Native DOM Scale Sync ("The White Box" Zoom)
        this.canvas.setDimensions({
            width: this.baseWidth * scale,
            height: this.baseHeight * scale
        });

        // Ensure internal pan is 0 so the DOM wrapper represents exact bounds
        const vpt = this.canvas.viewportTransform;
        if (vpt) {
            vpt[4] = 0;
            vpt[5] = 0;
        }

        this.canvas.requestRenderAll();
    }

    /**
     * Update the zoom from UI sliders (e.g. 150 = 1.5x scale)
     */
    public setManualZoom(zoomPercent: number) {
        const scale = zoomPercent / 100;
        this.canvas.setZoom(scale);
        this.canvas.setDimensions({
            width: this.baseWidth * scale,
            height: this.baseHeight * scale
        });

        // Let the scroll container handle the pan, keep Fabric's internal view centered
        const vpt = this.canvas.viewportTransform;
        if (vpt) {
            vpt[4] = 0;
            vpt[5] = 0;
        }

        this.canvas.requestRenderAll();
    }

    public setPlaceholderKey(key: string | undefined) {
        const activeObj = this.canvas.getActiveObject();
        if (activeObj && (activeObj.type === 'text' || activeObj.type === 'textbox')) {
            (activeObj as any).set('placeholderKey', key);
            this.syncToStore();
        }
    }

    public exportTemplateJSON(): string {
        // Strip down the current objects into a minimal enlivener array for the database
        // QA: Exclude locked layers from the user-editable template path
        const rawObjects = this.canvas.getObjects()
            .filter((obj: any) => !obj.locked)
            .map(obj => {
                const serialized = obj.toObject(['id', 'locked', 'autoSize', 'placeholderKey', 'proxyUrl', 'highResUrl', 's3Url']);
                // Remove huge data paths if it's an image we just want the reference url
                if (serialized.type === 'image' && serialized.src?.startsWith('data:')) {
                    serialized.src = serialized.proxyUrl;
                }
                return serialized;
            });
        return JSON.stringify(rawObjects, null, 2);
    }

    public deleteSelected() {
        const activeObjects = this.canvas.getActiveObjects();
        if (activeObjects.length) {
            this.canvas.discardActiveObject();
            activeObjects.forEach(obj => {
                this.canvas.remove(obj);
            });
            this.canvas.requestRenderAll();
            this.syncToStore();
            this.updateActiveObjectBox();
        }
    }

    // Architect UX: Deep Cloning
    private clipboard: any = null;

    public async copy() {
        const activeObj = this.canvas.getActiveObject();
        if (activeObj) {
            // Fabric v6 uses promises for clone
            const clonedObj = await activeObj.clone();
            this.clipboard = clonedObj;
        }
    }

    public async paste() {
        if (!this.clipboard) return;

        const clonedObj = await this.clipboard.clone();
        this.canvas.discardActiveObject();

        clonedObj.set({
            left: (clonedObj.left || 0) + 20,
            top: (clonedObj.top || 0) + 20,
            evented: true,
        });

        if (clonedObj.type === 'activeSelection') {
            clonedObj.canvas = this.canvas;
            clonedObj.forEachObject((obj: any) => {
                this.canvas.add(obj);
            });
            clonedObj.setCoords();
        } else {
            clonedObj.set('id', crypto.randomUUID());
            this.canvas.add(clonedObj);
        }

        // Must sync clipboard to new offset clone to allow multiple pastes
        this.clipboard = await clonedObj.clone();

        this.canvas.setActiveObject(clonedObj);
        this.canvas.requestRenderAll();
        this.syncToStore();
        this.updateActiveObjectBox();
    }

    // ── Production Agent: Visual Restrictions ──────────────────

    private safetyShroudObj: fabric.Rect | null = null;

    public toggleSafetyShroud(show: boolean) {
        if (show) {
            if (this.safetyShroudObj) return;

            // Standard print bleed is typically 0.125" to 0.25". 
            // We'll visually represent it as 18px inward.
            const bleedMargin = 18;
            this.safetyShroudObj = new fabric.Rect({
                left: bleedMargin,
                top: bleedMargin,
                width: this.baseWidth - (bleedMargin * 2),
                height: this.baseHeight - (bleedMargin * 2),
                fill: 'transparent',
                stroke: 'rgba(239, 68, 68, 0.7)', // red-500
                strokeWidth: 2,
                strokeDashArray: [10, 5],
                selectable: false,
                evented: false,
                excludeFromExport: true // Do not serialize!
            });

            this.canvas.add(this.safetyShroudObj);
            // send to bottom so it doesn't overlap object selection boxes
            this.canvas.sendObjectToBack(this.safetyShroudObj);
        } else {
            if (this.safetyShroudObj) {
                this.canvas.remove(this.safetyShroudObj);
                this.safetyShroudObj = null;
            }
        }
        this.canvas.requestRenderAll();
    }

    public toggleDPIHeatmap(show: boolean) {
        const objects = this.canvas.getObjects();
        let changed = false;

        objects.forEach(obj => {
            if (obj.type === 'image') {
                const img = obj as fabric.Image;

                // Clear existing filters
                img.filters = [];

                if (show) {
                    // We assume images were imported at 300DPI natively
                    // DPICalculator throws if the physical scale drops it below 150DPI
                    const isLowRes = DPICalculator.checkLowDPI(img.scaleX || 1, img.scaleY || 1, 300);

                    if (isLowRes) {
                        // Apply a highly visible red tint filter
                        const filter = new fabric.filters.BlendColor({
                            color: 'red',
                            mode: 'tint',
                            alpha: 0.6
                        });
                        img.filters.push(filter);
                    }
                }

                img.applyFilters();
                changed = true;
            }
        });

        if (changed) {
            this.canvas.requestRenderAll();
        }
    }

    // ── Export Methods ──────────────────────────────────────────

    public exportAsPNG(filename: string = 'design.png') {
        const dataUrl = this.canvas.toDataURL({ format: 'png', multiplier: 2 });
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
    }

    public exportAsSVG(filename: string = 'design.svg') {
        const svg = this.canvas.toSVG();
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    }

    public exportAsPDF(filename: string = 'design.pdf') {
        // Use canvas toDataURL and create a simple PDF wrapper
        const dataUrl = this.canvas.toDataURL({ format: 'png', multiplier: 2 });
        const width = this.baseWidth;
        const height = this.baseHeight;

        // Minimal PDF generation (no external dependency needed)
        const imgData = dataUrl.split(',')[1];
        const pdfWidth = width * 0.75; // convert px to pt (96dpi -> 72dpi)
        const pdfHeight = height * 0.75;

        // Create a simple PDF with embedded PNG
        // For production you'd use pdf-lib, but this works for MVP
        const pdf = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${pdfWidth} ${pdfHeight}]/Contents 4 0 R/Resources<</XObject<</Img 5 0 R>>>>>>endobj
4 0 obj<</Length 44>>stream
q ${pdfWidth} 0 0 ${pdfHeight} 0 0 cm /Img Do Q
endstream
endobj
5 0 obj<</Type/XObject/Subtype/Image/Width ${width * 2}/Height ${height * 2}/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ${imgData.length}>>stream
`;
        // For a proper PDF we'll use the PNG data URL approach with a download
        // Simplified: just download as PNG with .pdf extension won't work well
        // Instead, open in a new tab for print-to-PDF
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html><head><title>${filename}</title><style>
                    @page { size: ${width}px ${height}px; margin: 0; }
                    body { margin: 0; padding: 0; }
                    img { width: 100%; height: 100%; }
                </style></head><body>
                    <img src="${dataUrl}" onload="window.print();"/>
                </body></html>
            `);
            printWindow.document.close();
        }
    }

    // ── Image Filter Methods ────────────────────────────────────

    public applyImageFilter(filterType: string, value: number) {
        const activeObj = this.canvas.getActiveObject();
        if (!activeObj || activeObj.type !== 'image') return;

        const img = activeObj as fabric.Image;

        // Remove existing filter of this type
        img.filters = (img.filters || []).filter((f: any) => f.type !== filterType);

        if (value !== 0) {
            let filter: any = null;

            switch (filterType) {
                case 'Brightness':
                    filter = new fabric.filters.Brightness({ brightness: value / 100 });
                    break;
                case 'Contrast':
                    filter = new fabric.filters.Contrast({ contrast: value / 100 });
                    break;
                case 'Saturation':
                    filter = new fabric.filters.Saturation({ saturation: value / 100 });
                    break;
                case 'Blur':
                    filter = new fabric.filters.Blur({ blur: value / 100 });
                    break;
                case 'Grayscale':
                    if (value > 0) filter = new fabric.filters.Grayscale();
                    break;
                case 'Sepia':
                    if (value > 0) filter = new fabric.filters.Sepia();
                    break;
                case 'Invert':
                    if (value > 0) filter = new fabric.filters.Invert();
                    break;
            }

            if (filter) {
                img.filters.push(filter);
            }
        }

        img.applyFilters();
        this.canvas.requestRenderAll();
        this.syncToStore();
    }

    public resetImageFilters() {
        const activeObj = this.canvas.getActiveObject();
        if (!activeObj || activeObj.type !== 'image') return;

        const img = activeObj as fabric.Image;
        img.filters = [];
        img.applyFilters();
        this.canvas.requestRenderAll();
        this.syncToStore();
    }

    // ── Flip/Mirror Methods ─────────────────────────────────────

    public flipHorizontal() {
        const activeObj = this.canvas.getActiveObject();
        if (!activeObj) return;
        activeObj.set('flipX', !activeObj.flipX);
        this.canvas.requestRenderAll();
        this.syncToStore();
    }

    public flipVertical() {
        const activeObj = this.canvas.getActiveObject();
        if (!activeObj) return;
        activeObj.set('flipY', !activeObj.flipY);
        this.canvas.requestRenderAll();
        this.syncToStore();
    }

    // ── Alignment Methods ───────────────────────────────────────

    public alignObjects(alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') {
        const activeObj = this.canvas.getActiveObject();
        if (!activeObj) return;

        const canvasWidth = this.canvas.getWidth() / this.canvas.getZoom();
        const canvasHeight = this.canvas.getHeight() / this.canvas.getZoom();

        switch (alignment) {
            case 'left':
                activeObj.set('left', 0);
                break;
            case 'center':
                activeObj.set('left', canvasWidth / 2 - activeObj.getScaledWidth() / 2);
                break;
            case 'right':
                activeObj.set('left', canvasWidth - activeObj.getScaledWidth());
                break;
            case 'top':
                activeObj.set('top', 0);
                break;
            case 'middle':
                activeObj.set('top', canvasHeight / 2 - activeObj.getScaledHeight() / 2);
                break;
            case 'bottom':
                activeObj.set('top', canvasHeight - activeObj.getScaledHeight());
                break;
        }

        activeObj.setCoords();
        this.canvas.requestRenderAll();
        this.syncToStore();
        this.updateActiveObjectBox();
    }

    public distributeObjects(direction: 'horizontal' | 'vertical') {
        const activeObjects = this.canvas.getActiveObjects();
        if (activeObjects.length < 3) return;

        if (direction === 'horizontal') {
            const sorted = [...activeObjects].sort((a, b) => (a.left || 0) - (b.left || 0));
            const first = sorted[0].left || 0;
            const last = (sorted[sorted.length - 1].left || 0);
            const gap = (last - first) / (sorted.length - 1);
            sorted.forEach((obj, i) => {
                obj.set('left', first + gap * i);
                obj.setCoords();
            });
        } else {
            const sorted = [...activeObjects].sort((a, b) => (a.top || 0) - (b.top || 0));
            const first = sorted[0].top || 0;
            const last = (sorted[sorted.length - 1].top || 0);
            const gap = (last - first) / (sorted.length - 1);
            sorted.forEach((obj, i) => {
                obj.set('top', first + gap * i);
                obj.setCoords();
            });
        }

        this.canvas.requestRenderAll();
        this.syncToStore();
    }

    // ── Opacity Method ──────────────────────────────────────────

    public setOpacity(value: number) {
        const activeObj = this.canvas.getActiveObject();
        if (!activeObj) return;
        activeObj.set('opacity', value / 100);
        this.canvas.requestRenderAll();
        this.syncToStore();
    }

    public async saveCurrentPageState(): Promise<string> {
        return JSON.stringify(this.canvas.toObject(['id', 'locked', 'autoSize', 'placeholderKey', 'proxyUrl', 'highResUrl', 's3Url', 'maxPrintWidth', 'maxPrintHeight', 'isFontLoading']));
    }

    public async loadPageState(pageJSON: string) {
        try {
            const json = JSON.parse(pageJSON);
            await this.canvas.loadFromJSON(json);
            this.canvas.requestRenderAll();
            this.syncToStore();
        } catch (err) {
            console.error('Failed to load page state:', err);
        }
    }

    public clearCanvas() {
        this.canvas.clear();
        this.canvas.backgroundColor = '#ffffff';
        this.canvas.requestRenderAll();
        this.syncToStore();
    }
}
