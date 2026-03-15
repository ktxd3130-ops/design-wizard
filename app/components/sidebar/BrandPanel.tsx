'use client';

import { Shield } from 'lucide-react';
import { FabricCanvas } from '@/core/FabricCanvas';
import { BrandConfig, DynamicConfigLoader } from '@/core/config';

interface BrandPanelProps {
    fabricRef: React.RefObject<FabricCanvas | null>;
    brandConfig: BrandConfig | null;
    setBrandConfig: (config: BrandConfig) => void;
    isAdmin: boolean;
}

export function BrandPanel({ fabricRef, brandConfig, setBrandConfig, isAdmin }: BrandPanelProps) {
    return (
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
            <p className="text-[11px] text-[var(--ui-30)] uppercase tracking-wider font-semibold">Brand Theme</p>
            {[
                { name: 'StickyLife', brand: 'stickylife', color: '#3b82f6' },
                { name: 'WallMonkeys', brand: 'wallmonkeys', color: '#f97316' },
                { name: 'HC Brands', brand: 'hcbrands', color: '#10b981' },
            ].map(b => (
                <button key={b.brand} onClick={(e) => {
                    e.preventDefault();
                    const config = DynamicConfigLoader.loadConfig(b.brand);
                    setBrandConfig(config);
                    DynamicConfigLoader.applyThemeToDOM(config);
                    if (fabricRef.current) {
                        fabricRef.current.animateToTheme(config.colors.primary, config.typography.defaultFont);
                    }
                    window.history.pushState({}, '', `?brand=${b.brand}${isAdmin ? '&mode=admin' : ''}`);
                }} className="w-full flex items-center gap-3 px-5 py-4 bg-[var(--ui-5)] hover:bg-[var(--ui-10)] rounded-xl border border-[var(--ui-5)] transition-colors cursor-pointer group">
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: b.color }} />
                    <div className="text-left">
                        <span className="text-sm font-semibold text-[var(--ui-80)] group-hover:text-[var(--ui-100)]">{b.name}</span>
                        <span className="block text-[10px] text-[var(--ui-30)]">Apply theme</span>
                    </div>
                </button>
            ))}
            {isAdmin && (
                <div className="mt-4 pt-4 border-t border-[var(--ui-10)]">
                    <p className="text-[11px] text-[var(--ui-30)] uppercase tracking-wider font-semibold mb-4 flex items-center gap-1"><Shield size={11} /> Template Mapping</p>
                    <select onChange={(e) => fabricRef.current?.setPlaceholderKey(e.target.value)} className="w-full bg-[var(--ui-10)] border border-[var(--ui-10)] text-[var(--ui-80)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/50">
                        <option value="">No Mapping</option>
                        {['{{USER_NAME}}', '{{EMAIL}}', '{{PHONE}}', '{{COMPANY}}'].map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                </div>
            )}
        </div>
    );
}
