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
            if (target && target.type === 'textbox' && (target as any).autoSize) {
                const textbox = target as fabric.Textbox;

                // When scaled out, font size goes up, scale resets to 1
                textbox.fontSize = (textbox.fontSize || 24) * textbox.scaleX;
                textbox.width = (textbox.width || 100) * textbox.scaleX;

                textbox.scaleX = 1;
                textbox.scaleY = 1;

                this.canvas.renderAll();
            }
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

            this.canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY } as fabric.Point, zoom);
            opt.e.preventDefault();
            opt.e.stopPropagation();
        });

        // Enable Canvas Background Panning
        this.canvas.on('mouse:down', (opt) => {
            const evt = opt.e as any;
            if (!this.canvas.getActiveObject() && evt) {
                this.isDragging = true;
                this.lastPosX = evt.clientX || (evt.touches && evt.touches[0].clientX);
                this.lastPosY = evt.clientY || (evt.touches && evt.touches[0].clientY);
            }
        });

        this.canvas.on('mouse:move', (opt) => {
            const evt = opt.e as any;
            if (this.isDragging && evt) {
                const clientX = evt.clientX || (evt.touches && evt.touches[0].clientX);
                const clientY = evt.clientY || (evt.touches && evt.touches[0].clientY);

                if (clientX !== undefined && clientY !== undefined) {
                    const vpt = this.canvas.viewportTransform;
                    if (vpt) {
                        vpt[4] += clientX - this.lastPosX;
                        vpt[5] += clientY - this.lastPosY;
                        this.canvas.requestRenderAll();
                        this.lastPosX = clientX;
                        this.lastPosY = clientY;
                    }
                }
            }
        });

        this.loadInitialState();
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

        // Ensure Production Metadata remains intact (e.g. tracking zIndex or specific types)
        // Update the Zustand store immediately so the UI is reacting in real-time (<200ms)
        this.syncToStore();
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

    private loadInitialState() {
        // Load state from the Zustand persisted store
        const stateObjects = useDesignStore.getState().state.objects;
        // For MVP, we'll restore text objects if any exist in storage
        stateObjects.forEach((obj: any) => {
            if (obj.type === 'text') {
                const text = new fabric.Textbox(obj.text || 'Text', {
                    ...obj,
                    selectable: !obj.locked,
                    evented: !obj.locked,
                });
                this.canvas.add(text);
            }
        });

        if (stateObjects.length > 0) {
            this.canvas.renderAll();
        }
    }

    public addText() {
        const text = new fabric.Textbox('New Text', {
            left: 100,
            top: 100,
            fontFamily: 'sans-serif',
            fontSize: 24,
            fill: '#000000',
            id: crypto.randomUUID(),
            autoSize: true, // Architect: enable by default
            isFontLoading: false,
        });
        this.canvas.add(text);
        this.canvas.setActiveObject(text);
        this.syncToStore();
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
        this.syncToStore();
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
        const vpw = window.innerWidth;
        const mobilePadding = 40;

        // If mobile portrait or tight space
        if (vpw < this.canvas.getWidth()) {
            const scale = (vpw - mobilePadding) / this.canvas.getWidth();
            this.canvas.setZoom(scale);

            // Center pan horizontally over the grey zone
            const vpt = this.canvas.viewportTransform;
            if (vpt) {
                vpt[4] = (vpw - (this.canvas.getWidth() * scale)) / 2;
                vpt[5] = 40; // Top push
            }
        } else {
            this.canvas.setZoom(1);
        }
        this.canvas.renderAll();
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
        const rawObjects = this.canvas.getObjects().map(obj => {
            const serialized = obj.toObject(['id', 'locked', 'autoSize', 'placeholderKey', 'proxyUrl', 'highResUrl', 's3Url']);
            // Remove huge data paths if it's an image we just want the reference url
            if (serialized.type === 'image' && serialized.src?.startsWith('data:')) {
                serialized.src = serialized.proxyUrl;
            }
            return serialized;
        });
        return JSON.stringify(rawObjects, null, 2);
    }
}
