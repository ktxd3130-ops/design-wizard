import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DesignState } from './types';

interface DesignStore {
    state: DesignState;
    syncCanvasState: (partial: Partial<DesignState>) => void;
}

const initialState: DesignState = {
    version: '1.0.0',
    design_id: 'local_draft_' + Date.now(),
    preview: null,
    objects: [],
    sessionAssets: [],
    canvasWidth: 800,
    canvasHeight: 600,
    backgroundColor: '#ffffff',
    safeZoneMargin: 20,
    warnings: [],
};

export const useDesignStore = create<DesignStore>()(
    persist(
        (set) => ({
            state: initialState,
            syncCanvasState: (partial) =>
                set((store) => ({ state: { ...store.state, ...partial } })),
        }),
        {
            name: 'design-wizard-storage',
        }
    )
);
