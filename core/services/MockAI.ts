import { SessionAsset } from '../types';
import { useDesignStore } from '../storage';

/**
 * Mock Service imitating future AI endpoints (Background Removal, Vectorization)
 * Built to isolate UI flow before spending real API credits.
 */
export class MockAIService {

    static async removeBackground(asset: SessionAsset): Promise<string> {
        return new Promise((resolve) => {
            // Simulate API latency
            setTimeout(() => {
                // Since it's a mock, we just return the same proxyUrl
                // In reality, this would return a new URL pointing to the processed PNG from the staging bucket
                resolve(asset.proxyUrl);
            }, 1500);
        });
    }

    static async vectorizeImage(asset: SessionAsset): Promise<string> {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Mock SVG payload representing a path instead of pixels
                const mockSvgDataUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="blue" /></svg>`;
                resolve(mockSvgDataUrl);
            }, 2000);
        });
    }
}
