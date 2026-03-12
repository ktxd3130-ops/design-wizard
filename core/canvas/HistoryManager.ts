import * as fabric from 'fabric';

/**
 * HistoryManager
 * Manages undo/redo state for a fabric.Canvas instance.
 * Serialises the full canvas JSON on each mutation and replays it on undo/redo.
 */
export class HistoryManager {
    private canvas: fabric.Canvas;
    private history: any[] = [];
    private historyIndex = -1;
    private isHistoryAction = false;

    /** Maximum number of history snapshots to retain (prevents runaway memory). */
    private maxSnapshots = 50;

    constructor(canvas: fabric.Canvas) {
        this.canvas = canvas;
    }

    /**
     * Attach canvas listeners that auto-save history on object mutations.
     */
    attach() {
        this.canvas.on('object:added', () => this.save());
        this.canvas.on('object:modified', () => this.save());
        this.canvas.on('object:removed', () => this.save());
    }

    /**
     * Returns true when the manager is currently replaying a history entry
     * (callers can use this to avoid re-saving during undo/redo).
     */
    get isReplaying(): boolean {
        return this.isHistoryAction;
    }

    /**
     * Capture the current canvas state as a history snapshot.
     * If the user has rewound and then makes a new edit, future history is truncated.
     */
    save() {
        if (this.isHistoryAction) return;

        const json = (this.canvas as any).toJSON(['id', 'name', 'locked']);

        // If we are rewound and saving, truncate future history
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        this.history.push(json);
        this.historyIndex++;

        // Cap history to avoid blowing up memory
        if (this.history.length > this.maxSnapshots) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    /**
     * Step backwards one snapshot. Returns true if the canvas was restored.
     */
    async undo(): Promise<boolean> {
        if (this.historyIndex <= 0) return false;

        this.isHistoryAction = true;
        this.historyIndex--;
        await this.canvas.loadFromJSON(this.history[this.historyIndex]);
        this.canvas.renderAll();
        this.isHistoryAction = false;
        return true;
    }

    /**
     * Step forward one snapshot. Returns true if the canvas was restored.
     */
    async redo(): Promise<boolean> {
        if (this.historyIndex >= this.history.length - 1) return false;

        this.isHistoryAction = true;
        this.historyIndex++;
        await this.canvas.loadFromJSON(this.history[this.historyIndex]);
        this.canvas.renderAll();
        this.isHistoryAction = false;
        return true;
    }

    /**
     * Completely reset history (useful after loading a fresh template).
     */
    clear() {
        this.history = [];
        this.historyIndex = -1;
    }
}
