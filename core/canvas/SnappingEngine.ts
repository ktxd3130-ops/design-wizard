import * as fabric from 'fabric';
import { useDesignStore } from '../storage';

/**
 * SnappingEngine
 * Handles magnetic snapping to center, safe-zone edges, and guide line rendering.
 * Accepts a fabric.Canvas instance via constructor and operates on it.
 */
export class SnappingEngine {
    private canvas: fabric.Canvas;
    private snappingDistance = 5;
    private guideLines: fabric.Line[] = [];
    private snapRafId = 0;

    constructor(canvas: fabric.Canvas) {
        this.canvas = canvas;
    }

    /**
     * Clear all rendered guide lines from the canvas.
     */
    clearGuides() {
        this.guideLines.forEach(line => this.canvas.remove(line));
        this.guideLines = [];
    }

    /**
     * Draw a single dashed pink guide line at the given coordinates.
     */
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

    /**
     * Perform magnetic snapping for the given target object.
     * Snaps to canvas center X/Y and to the safe-zone margins.
     * Runs inside a rAF loop to avoid jank during fast drags.
     */
    handleSnapping(target: any) {
        if (this.snapRafId) cancelAnimationFrame(this.snapRafId);

        this.snapRafId = requestAnimationFrame(() => {
            this.clearGuides();

            const canvasWidth = this.canvas.getWidth();
            const canvasHeight = this.canvas.getHeight();
            // Optional: fallback to 0 if zustand isn't ready
            const safeZone = useDesignStore.getState().state?.safeZoneMargin || 25;
            const centerX = canvasWidth / 2;
            const centerY = canvasHeight / 2;

            const objWidth = target.getScaledWidth();
            const objHeight = target.getScaledHeight();
            const objCenterX = target.left + objWidth / 2;
            const objCenterY = target.top + objHeight / 2;

            let snapped = false;

            // X-Axis Magnetic Snapping
            if (Math.abs(objCenterX - centerX) < this.snappingDistance) {
                target.set('left', centerX - objWidth / 2);
                this.drawGuideLine([centerX, 0, centerX, canvasHeight]);
                snapped = true;
            } else if (Math.abs(target.left - safeZone) < this.snappingDistance) {
                target.set('left', safeZone);
                this.drawGuideLine([safeZone, 0, safeZone, canvasHeight]);
                snapped = true;
            } else if (Math.abs((target.left + objWidth) - (canvasWidth - safeZone)) < this.snappingDistance) {
                target.set('left', canvasWidth - safeZone - objWidth);
                this.drawGuideLine([canvasWidth - safeZone, 0, canvasWidth - safeZone, canvasHeight]);
                snapped = true;
            }

            // Y-Axis Magnetic Snapping
            if (Math.abs(objCenterY - centerY) < this.snappingDistance) {
                target.set('top', centerY - objHeight / 2);
                this.drawGuideLine([0, centerY, canvasWidth, centerY]);
                snapped = true;
            } else if (Math.abs(target.top - safeZone) < this.snappingDistance) {
                target.set('top', safeZone);
                this.drawGuideLine([0, safeZone, canvasWidth, safeZone]);
                snapped = true;
            } else if (Math.abs((target.top + objHeight) - (canvasHeight - safeZone)) < this.snappingDistance) {
                target.set('top', canvasHeight - safeZone - objHeight);
                this.drawGuideLine([0, canvasHeight - safeZone, canvasWidth, canvasHeight - safeZone]);
                snapped = true;
            }

            if (snapped) {
                target.setCoords(); // Crucial for Fabric to understand the manual offset
                this.canvas.requestRenderAll();
            }
        });
    }

    /**
     * Dispose of pending animation frames when tearing down.
     */
    dispose() {
        if (this.snapRafId) {
            cancelAnimationFrame(this.snapRafId);
            this.snapRafId = 0;
        }
        this.clearGuides();
    }
}
