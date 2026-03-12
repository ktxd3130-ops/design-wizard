import { describe, it, expect } from 'vitest';
import { DynamicConfigLoader } from '../config';

describe('DynamicConfigLoader', () => {
    it('loads stickylife config by default', () => {
        const config = DynamicConfigLoader.loadConfig(null);
        expect(config.id).toBe('stickylife');
    });

    it('loads wallmonkeys config', () => {
        const config = DynamicConfigLoader.loadConfig('wallmonkeys');
        expect(config.id).toBe('wallmonkeys');
        expect(config.colors.primary).toBe('#f97316');
    });

    it('loads hcbrands config', () => {
        const config = DynamicConfigLoader.loadConfig('hcbrands');
        expect(config.id).toBe('hcbrands');
    });

    it('falls back to stickylife for unknown brands', () => {
        const config = DynamicConfigLoader.loadConfig('nonexistent');
        expect(config.id).toBe('stickylife');
    });

    it('is case-insensitive', () => {
        const config = DynamicConfigLoader.loadConfig('WallMonkeys');
        expect(config.id).toBe('wallmonkeys');
    });
});
