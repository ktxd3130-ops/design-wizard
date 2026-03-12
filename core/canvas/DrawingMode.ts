import * as fabric from 'fabric';

export interface DrawingSettings {
    type: string;    // 'pen' | 'marker' | 'highlighter'
    color: string;
    width: number;
}

/**
 * DrawingMode
 * Encapsulates free-drawing mode activation, brush configuration,
 * and path-creation bookkeeping for a fabric.Canvas instance.
 */
export class DrawingMode {
    private canvas: fabric.Canvas;
    private syncCallback: (() => void) | null = null;
    private pathCreatedBound: ((opt: any) => void) | null = null;

    constructor(canvas: fabric.Canvas) {
        this.canvas = canvas;
    }

    /**
     * Register a callback that fires whenever a new drawing path is created.
     * Typically used to trigger a store sync.
     */
    onPathCreated(callback: () => void) {
        this.syncCallback = callback;
    }

    /**
     * Toggle drawing mode on or off and configure the active brush.
     *
     * @param isDrawing  Whether to enable or disable free-draw mode.
     * @param settings   Brush type, colour, and width.
     */
    toggle(isDrawing: boolean, settings: DrawingSettings) {
        this.canvas.isDrawingMode = isDrawing;

        // Clean up any previous path:created listener we installed
        if (this.pathCreatedBound) {
            this.canvas.off('path:created', this.pathCreatedBound);
            this.pathCreatedBound = null;
        }

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

        // Ensure paths created have IDs so they can be deleted / tracked
        this.pathCreatedBound = (opt: any) => {
            opt.path.set({ id: `path_${Math.random().toString(36).substr(2, 9)}` });
            if (this.syncCallback) this.syncCallback();
        };
        this.canvas.on('path:created', this.pathCreatedBound);
    }

    /**
     * Tear down listeners when the engine is no longer needed.
     */
    dispose() {
        if (this.pathCreatedBound) {
            this.canvas.off('path:created', this.pathCreatedBound);
            this.pathCreatedBound = null;
        }
        this.canvas.isDrawingMode = false;
    }
}
