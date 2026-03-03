export interface BrandConfig {
    id: string;
    name: string;
    colors: {
        primary: string;
        primaryHover: string;
        accent: string;
        surface: string;
    };
    typography: {
        defaultFont: string;
    };
}

const BRANDS: Record<string, BrandConfig> = {
    wallmonkeys: {
        id: 'wallmonkeys',
        name: 'WallMonkeys',
        colors: {
            primary: '#f97316', // orange-500
            primaryHover: '#ea580c', // orange-600
            accent: '#fb923c', // orange-400
            surface: '#fff7ed', // orange-50
        },
        typography: { defaultFont: 'sans-serif' }
    },
    stickylife: {
        id: 'stickylife',
        name: 'StickyLife',
        colors: {
            primary: '#3b82f6', // blue-500
            primaryHover: '#2563eb', // blue-600
            accent: '#60a5fa', // blue-400
            surface: '#eff6ff', // blue-50
        },
        typography: { defaultFont: 'sans-serif' }
    },
    hcbrands: {
        id: 'hcbrands',
        name: 'HC Brands',
        colors: {
            primary: '#10b981', // emerald-500
            primaryHover: '#059669', // emerald-600
            accent: '#34d399', // emerald-400
            surface: '#ecfdf5', // emerald-50
        },
        typography: { defaultFont: 'serif' }
    }
};

export class DynamicConfigLoader {
    static loadConfig(brandId: string | null): BrandConfig {
        const key = brandId?.toLowerCase() || 'stickylife'; // Default fallback
        return BRANDS[key] || BRANDS['stickylife'];
    }

    static applyThemeToDOM(config: BrandConfig) {
        if (typeof window === 'undefined') return;
        const root = document.documentElement;
        root.style.setProperty('--brand-primary', config.colors.primary);
        root.style.setProperty('--brand-primary-hover', config.colors.primaryHover);
        root.style.setProperty('--brand-accent', config.colors.accent);
        root.style.setProperty('--brand-surface', config.colors.surface);
    }
}
