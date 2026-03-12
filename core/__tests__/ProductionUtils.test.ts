import { describe, it, expect } from 'vitest';
import { DPICalculator } from '../ProductionUtils';

describe('DPICalculator', () => {
    describe('checkLowDPI', () => {
        it('returns false when scale is 1.0 (300 DPI)', () => {
            expect(DPICalculator.checkLowDPI(1, 1)).toBe(false);
        });

        it('returns false at 2x scale (150 DPI - boundary)', () => {
            expect(DPICalculator.checkLowDPI(2, 2)).toBe(false);
        });

        it('returns true when scale exceeds 2x (below 150 DPI)', () => {
            expect(DPICalculator.checkLowDPI(2.1, 2.1)).toBe(true);
        });

        it('uses the larger scale axis', () => {
            expect(DPICalculator.checkLowDPI(1, 3)).toBe(true);
        });

        it('works with custom base DPI', () => {
            expect(DPICalculator.checkLowDPI(1, 1, 100)).toBe(true);
        });
    });

    describe('getEffectiveDPI', () => {
        it('returns 300 at 1x scale', () => {
            expect(DPICalculator.getEffectiveDPI(1, 1)).toBe(300);
        });

        it('returns 150 at 2x scale', () => {
            expect(DPICalculator.getEffectiveDPI(2, 2)).toBe(150);
        });

        it('returns 100 at 3x scale', () => {
            expect(DPICalculator.getEffectiveDPI(3, 3)).toBe(100);
        });
    });

    describe('calculateMaxPrintSize', () => {
        it('doubles dimensions for 300 DPI source at 150 min', () => {
            const result = DPICalculator.calculateMaxPrintSize(100, 200);
            expect(result.maxWidth).toBe(200);
            expect(result.maxHeight).toBe(400);
        });
    });

    describe('checkLegibility', () => {
        it('passes for normal font size and weight', () => {
            const result = DPICalculator.checkLegibility(24, 400);
            expect(result.hasWarning).toBe(false);
        });

        it('warns when font is below 6pt (8px)', () => {
            const result = DPICalculator.checkLegibility(7, 400);
            expect(result.hasWarning).toBe(true);
        });

        it('warns for ultra-thin font weight', () => {
            const result = DPICalculator.checkLegibility(24, 100);
            expect(result.hasWarning).toBe(true);
        });

        it('handles string font weight', () => {
            const result = DPICalculator.checkLegibility(24, 'bold');
            expect(result.hasWarning).toBe(false);
        });
    });
});
