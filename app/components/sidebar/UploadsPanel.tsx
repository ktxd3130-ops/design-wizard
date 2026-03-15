'use client';

import { UploadCloud, Image as ImageIcon } from 'lucide-react';
import { FabricCanvas } from '@/core/FabricCanvas';
import { DesignState } from '@/core/types';

interface UploadsPanelProps {
    fabricRef: React.RefObject<FabricCanvas | null>;
    designState: DesignState;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function UploadsPanel({ fabricRef, designState, onFileUpload }: UploadsPanelProps) {
    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="relative">
                <button className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-[var(--ui-100)] py-3 rounded-lg font-semibold text-sm transition-colors cursor-pointer relative overflow-hidden shadow-lg shadow-violet-500/20">
                    <UploadCloud size={18} /> Upload files
                    <input type="file" accept="image/*" onChange={onFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </button>
            </div>
            {designState.sessionAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ImageIcon size={40} className="text-[var(--ui-10)] mb-3" />
                    <p className="text-sm text-[var(--ui-40)] font-medium">No images uploaded</p>
                    <p className="text-xs text-[var(--ui-20)] mt-1">Drag files here or click Upload</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2">
                    {designState.sessionAssets.map(asset => (
                        <div key={asset.id} onClick={() => fabricRef.current?.addImage(asset.proxyUrl, crypto.randomUUID())} className="relative group aspect-square bg-[var(--ui-5)] rounded-lg overflow-hidden border border-[var(--ui-5)] hover:border-violet-500/50 transition-all cursor-pointer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={asset.proxyUrl} alt="Upload" className="w-full h-full object-cover" />
                            {asset.status === 'uploading' && (
                                <div className="absolute inset-x-0 bottom-0 bg-black/70 backdrop-blur p-2">
                                    <div className="w-full bg-[var(--ui-20)] rounded-full h-1">
                                        <div className="bg-violet-500 h-1 rounded-full transition-all duration-300" style={{ width: `${asset.progress}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
