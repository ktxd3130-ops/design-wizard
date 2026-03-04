'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const DynamicCanvasApp = dynamic(() => import('./CanvasApp'), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-brand-primary" />
        </div>
    )
});

export default function Page() {
    return <DynamicCanvasApp />;
}
