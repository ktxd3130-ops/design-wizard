import { describe, it, expect } from 'vitest';
import { OrderValidationService } from '../OpenMageAPI';
import { DesignState } from '../types';

const makeState = (overrides: Partial<DesignState> = {}): DesignState => ({
    version: '1.0.0',
    design_id: 'test-id',
    preview: null,
    objects: [{ id: '1', type: 'text', left: 0, top: 0, width: 100, height: 50, angle: 0, scaleX: 1, scaleY: 1, opacity: 1, zIndex: 0 }],
    sessionAssets: [],
    canvasWidth: 800,
    canvasHeight: 600,
    backgroundColor: '#ffffff',
    safeZoneMargin: 20,
    warnings: [],
    activeObjectId: null,
    brandId: null,
    activeObjectBox: null,
    ...overrides,
});

describe('OrderValidationService', () => {
    it('returns true for a valid design with no warnings', () => {
        expect(OrderValidationService.validate(makeState())).toBe(true);
    });

    it('returns false when there are DPI warnings', () => {
        const state = makeState({
            warnings: [{ id: 'w1', type: 'dpi', message: 'Low DPI' }],
        });
        expect(OrderValidationService.validate(state)).toBe(false);
    });

    it('returns false when there are bleed warnings', () => {
        const state = makeState({
            warnings: [{ id: 'w2', type: 'bleed', message: 'Outside safe zone' }],
        });
        expect(OrderValidationService.validate(state)).toBe(false);
    });

    it('returns false when canvas is empty', () => {
        const state = makeState({ objects: [] });
        expect(OrderValidationService.validate(state)).toBe(false);
    });
});
