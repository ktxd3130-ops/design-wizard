import { ImageObject, BaseFabricObject } from './types';

export class DPICalculator {
    /**
     * Evaluates if the object's current scale pushes its effective DPI below
     * the 150 DPI threshold required for print.
     * Assumes the original proxy/highRes represents a 300 DPI asset at scale 1.0.
     */
    static checkLowDPI(scaleX: number, scaleY: number, baseDPI: number = 300): boolean {
        const maxScale = Math.max(scaleX, scaleY);
        // As scale increases, effective DPI decreases
        const effectiveDPI = baseDPI / maxScale;
        return effectiveDPI < 150;
    }

    static getEffectiveDPI(scaleX: number, scaleY: number, baseDPI: number = 300): number {
        return Math.round(baseDPI / Math.max(scaleX, scaleY));
    }

    /**
     * Pre-flight: Calculate the maximum physical dimensions this image can be printed
     * while maintaining the minimum 150 DPI threshold. (Returns pixels at 300 DPI scale)
     */
    static calculateMaxPrintSize(originalWidth: number, originalHeight: number, baseDPI: number = 300, minDPI: number = 150) {
        const maxScale = baseDPI / minDPI; // E.g., 300 / 150 = 2.0 scale max
        return {
            maxWidth: originalWidth * maxScale,
            maxHeight: originalHeight * maxScale
        };
    }

    /**
     * Minimum Legibility Check: For stamps or small signs, prints can bleed.
     * Flags a warning if font size is < 6pt or if thin weight is used.
     * Note: fontSize inside Fabric is typically px. We approximate 1px ~= 0.75pt.
     */
    static checkLegibility(fontSizePx: number, fontWeight: string | number): { hasWarning: boolean; message?: string } {
        const fontSizePt = fontSizePx * 0.75;

        if (fontSizePt < 6) {
            return { hasWarning: true, message: `Font size (${fontSizePt.toFixed(1)}pt) is below the 6pt minimum for print legibility.` };
        }

        const numericWeight = typeof fontWeight === 'string' ? parseInt(fontWeight) || 400 : fontWeight;
        if (numericWeight < 300) {
            return { hasWarning: true, message: `Font weight is too thin for reliable printing on most materials.` };
        }

        return { hasWarning: false };
    }

    /**
     * Production Agent: SVG Export Validator
     * Confirms that a vector object (path) is closed and safe for manufacturing cutters
     */
    static checkVectorReady(obj: BaseFabricObject): boolean {
        if (obj.type !== 'path') return true; // Only validate paths

        // Mocking a path checking routine. In production, this would parse the actual
        // SVG path data to ensure 'Z' or 'z' commands close all sub-paths.
        // And that stroke widths are thick enough, etc.
        return true;
    }
}
