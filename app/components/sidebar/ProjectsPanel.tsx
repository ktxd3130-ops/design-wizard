'use client';

import { Search, FolderOpen } from 'lucide-react';

export function ProjectsPanel() {
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-[#252536] z-10 shrink-0">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 mt-[-1px] text-white/30" />
                    <input placeholder="Search your projects" className="w-full bg-white/10 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white/80 placeholder-white/30 focus:outline-none focus:border-violet-500/50 transition-all font-medium" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Folders */}
                <div className="space-y-3">
                    <p className="text-[11px] font-bold tracking-wider uppercase text-white/50">Folders</p>
                    <div className="grid grid-cols-2 gap-2">
                        {['Uploads', 'Purchased', 'Starred', 'Trash'].map((folder) => (
                            <button key={folder} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg p-3 flex flex-col items-center justify-center gap-2 transition-all group">
                                <FolderOpen size={24} className="text-white/40 group-hover:text-violet-400" />
                                <span className="text-[11px] font-semibold text-white/80 group-hover:text-white">{folder}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recent Designs */}
                <div className="space-y-3">
                    <p className="text-[11px] font-bold tracking-wider uppercase text-white/50">Recent Designs</p>
                    <div className="grid grid-cols-2 gap-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="group cursor-pointer">
                                <div className="aspect-video bg-white/5 border border-white/5 rounded-lg mb-2 overflow-hidden relative">
                                    <div className={`absolute inset-0 opacity-20 bg-gradient-to-br from-violet-500/50 to-fuchsia-500/50`} />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 backdrop-blur-sm transition-all">
                                        <button className="bg-white text-black px-3 py-1.5 rounded-md text-xs font-bold">Edit</button>
                                    </div>
                                </div>
                                <p className="text-[11px] font-medium text-white/90">Untitled Design {i}</p>
                                <p className="text-[9px] text-white/50 mt-0.5">Edited {i}h ago</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
