'use client';

import dynamic from 'next/dynamic';

const DynamicCanvasApp = dynamic(() => import('./CanvasApp'), {
    ssr: false,
    loading: () => (
        <div style={{ minHeight: '100vh', background: '#1e1e2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
});

export default function Page() {
    return <DynamicCanvasApp />;
}
