import * as fabric from 'fabric';
import { BaseFabricObject } from './types';
import { useDesignStore } from './storage';
import { DPICalculator } from './ProductionUtils';
import { MockAIService } from './services/MockAI';
import { PlaceholderService } from './services/PlaceholderService';

export class FabricCanvas {
    public canvas: fabric.Canvas;

    private snappingDistance = 10;
    private guideLines: fabric.Line[] = [];

    // Touch panning state
    private isDragging = false;
    private lastPosX = 0;
    private lastPosY = 0;

    // 1:1 Scale Dimension Tracking
    public baseWidth = 800;
    public baseHeight = 600;

    constructor(canvasElement: HTMLCanvasElement) {
        this.canvas = new fabric.Canvas(canvasElement, {
            width: 800,
            height: 600,
            backgroundColor: '#ffffff',
            preserveObjectStacking: true,
        });

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

        this.canvas.on('mouse:up', () => {
            this.isDragging = false;
            this.clearGuideLines();
            this.canvas.renderAll();
        });

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

        // UI-UX Agent QA: Track active object selection for Bottom Sheet routing
        this.canvas.on('selection:created', (e) => this.handleSelection(e));
        this.canvas.on('selection:updated', (e) => this.handleSelection(e));
        this.canvas.on('selection:cleared', () => {
            useDesignStore.getState().syncCanvasState({ activeObjectId: null });
        });

        this.loadInitialState();
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

    private clearGuideLines() {
        this.guideLines.forEach(line => this.canvas.remove(line));
        this.guideLines = [];
    }

    private drawGuideLine(coords: [number, number, number, number]) {
        const line = new fabric.Line(coords, {
            stroke: '#ec4899', // pink-500
            strokeWidth: 1,
            selectable: false,
            evented: false,
            strokeDashArray: [5, 5],
            opacity: 0.8
        });
        this.canvas.add(line);
        this.guideLines.push(line);
    }

    private handleObjectModification(e: any) {
        const target = e.target;
        if (!target) return;

        if (e.e && e.e.type === 'mousemove') {
            this.handleSnapping(target);
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

    private handleSnapping(target: any) {
        this.clearGuideLines();

        const canvasWidth = this.canvas.getWidth();
        const canvasHeight = this.canvas.getHeight();
        const safeZone = useDesignStore.getState().state.safeZoneMargin;
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;

        const objWidth = target.getScaledWidth();
        const objHeight = target.getScaledHeight();
        const objCenterX = target.left + objWidth / 2;
        const objCenterY = target.top + objHeight / 2;

        let snapped = false;

        // Vertical Center Snap
        if (Math.abs(objCenterX - centerX) < this.snappingDistance) {
            target.set('left', centerX - objWidth / 2);
            this.drawGuideLine([centerX, 0, centerX, canvasHeight]);
            snapped = true;
        }

        // Horizontal Center Snap
        if (Math.abs(objCenterY - centerY) < this.snappingDistance) {
            target.set('top', centerY - objHeight / 2);
            this.drawGuideLine([0, centerY, canvasWidth, centerY]);
            snapped = true;
        }

        // Safe Zone Edges Snap
        if (Math.abs(target.left - safeZone) < this.snappingDistance) {
            target.set('left', safeZone);
            this.drawGuideLine([safeZone, 0, safeZone, canvasHeight]);
            snapped = true;
        }
        if (Math.abs((target.left + objWidth) - (canvasWidth - safeZone)) < this.snappingDistance) {
            target.set('left', canvasWidth - safeZone - objWidth);
            this.drawGuideLine([canvasWidth - safeZone, 0, canvasWidth - safeZone, canvasHeight]);
            snapped = true;
        }
        if (Math.abs(target.top - safeZone) < this.snappingDistance) {
            target.set('top', safeZone);
            this.drawGuideLine([0, safeZone, canvasWidth, safeZone]);
            snapped = true;
        }
        if (Math.abs((target.top + objHeight) - (canvasHeight - safeZone)) < this.snappingDistance) {
            target.set('top', canvasHeight - safeZone - objHeight);
            this.drawGuideLine([0, canvasHeight - safeZone, canvasWidth, canvasHeight - safeZone]);
            snapped = true;
        }

        if (snapped) {
            this.canvas.renderAll();
        }
    }

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
        const text = new fabric.Textbox(textStr, {
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
        if (!activeObj || activeObj.type !== 'textbox') return;

        // Font Loading Guard
        activeObj.set('isFontLoading', true);
        this.syncToStore(); // Trigger UI loader instantly

        try {
            // Mocking a network font load delay
            await new Promise(resolve => setTimeout(resolve, 800));
            // Actual apply step
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
        setTimeout(() => this.syncToStore(), 300);
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
        this.canvas.isDrawingMode = isDrawing;
        if (!isDrawing) return;

        // Configure brush based on type
        if (settings.type === 'pen' || settings.type === 'highlighter') {
            this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
        } else if (settings.type === 'marker') {
            this.canvas.freeDrawingBrush = new fabric.CircleBrush(this.canvas);
        }

        if (this.canvas.freeDrawingBrush) {
            this.canvas.freeDrawingBrush.color = settings.color;
            this.canvas.freeDrawingBrush.width = settings.width;
        }

        // Ensure paths created have IDs so they can be deleted
        this.canvas.on('path:created', (opt: any) => {
            opt.path.set({ id: `path_${Math.random().toString(36).substr(2, 9)}` });
            this.syncToStore();
        });
    }

    public updateActiveObjectProperty(key: string, value: any) {
        const activeObj = this.canvas.getActiveObject();
        if (activeObj) {
            activeObj.set(key, value);
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
}
