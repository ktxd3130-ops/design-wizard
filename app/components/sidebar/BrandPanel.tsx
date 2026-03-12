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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <p className="text-[11px] text-white/30 uppercase tracking-wider font-semibold">Brand Theme</p>
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
                }} className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-colors cursor-pointer group">
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: b.color }} />
                    <div className="text-left">
                        <span className="text-sm font-semibold text-white/80 group-hover:text-white">{b.name}</span>
                        <span className="block text-[10px] text-white/30">Apply theme</span>
                    </div>
                </button>
            ))}
            {isAdmin && (
                <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-[11px] text-white/30 uppercase tracking-wider font-semibold mb-3 flex items-center gap-1"><Shield size={11} /> Template Mapping</p>
                    <select onChange={(e) => fabricRef.current?.setPlaceholderKey(e.target.value)} className="w-full bg-white/10 border border-white/10 text-white/80 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50">
                        <option value="">No Mapping</option>
                        {['{{USER_NAME}}', '{{EMAIL}}', '{{PHONE}}', '{{COMPANY}}'].map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                </div>
            )}
        </div>
    );
}
