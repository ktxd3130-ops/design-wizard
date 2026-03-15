'use client';

import React, { useMemo, useCallback } from 'react';
import { FabricCanvas } from '@/core/FabricCanvas';
import { DesignState } from '@/core/types';
import {
  ArrowUp, ArrowDown, ChevronsUp, ChevronsDown,
  AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
  FlipHorizontal2, FlipVertical2, Lock, Unlock,
} from 'lucide-react';

interface PositionPanelProps {
  fabricRef: React.RefObject<FabricCanvas | null>;
  designState: DesignState;
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] uppercase tracking-wider font-semibold text-white/60 mb-2">
      {children}
    </h3>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[10px] text-white/40">{label}</span>
      <div className="relative">
        <input
          type="number"
          className="w-full bg-white/10 border border-white/5 rounded text-xs text-white/80 px-2 py-1.5 pr-6 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          value={Math.round(value * 100) / 100}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white/30">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

export function PositionPanel({ fabricRef, designState }: PositionPanelProps) {
  const selectedObject = useMemo(() => {
    if (!designState.activeObjectId) return null;
    return designState.objects.find((o) => o.id === designState.activeObjectId) ?? null;
  }, [designState.activeObjectId, designState.objects]);

  const getActive = useCallback(() => {
    return fabricRef.current?.canvas.getActiveObject() as any;
  }, [fabricRef]);

  const updateProp = useCallback(
    (key: string, value: any) => {
      fabricRef.current?.updateActiveObjectProperty(key, value);
    },
    [fabricRef],
  );

  const activeObj = getActive();

  if (!selectedObject) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white/90">Position</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-xs text-white/30 text-center">Select an element on the canvas to adjust its position.</p>
        </div>
      </div>
    );
  }

  const currentLeft = activeObj?.left ?? 0;
  const currentTop = activeObj?.top ?? 0;
  const currentWidth = (activeObj?.width ?? 0) * (activeObj?.scaleX ?? 1);
  const currentHeight = (activeObj?.height ?? 0) * (activeObj?.scaleY ?? 1);
  const currentAngle = activeObj?.angle ?? 0;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-white/5">
        <h2 className="text-sm font-semibold text-white/90">Position</h2>
      </div>

      {/* Arrange */}
      <div className="p-4 border-b border-white/5">
        <SectionHeader>Arrange</SectionHeader>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => fabricRef.current?.bringForward()}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs px-3 py-2 rounded-lg transition-colors"
          >
            <ArrowUp size={14} /> Forward
          </button>
          <button
            onClick={() => fabricRef.current?.sendBackwards()}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs px-3 py-2 rounded-lg transition-colors"
          >
            <ArrowDown size={14} /> Backward
          </button>
          <button
            onClick={() => fabricRef.current?.bringToFront()}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs px-3 py-2 rounded-lg transition-colors"
          >
            <ChevronsUp size={14} /> To Front
          </button>
          <button
            onClick={() => fabricRef.current?.sendToBack()}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs px-3 py-2 rounded-lg transition-colors"
          >
            <ChevronsDown size={14} /> To Back
          </button>
        </div>
      </div>

      {/* Align to page */}
      <div className="p-4 border-b border-white/5">
        <SectionHeader>Align to page</SectionHeader>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => fabricRef.current?.alignObjects('top')}
            className="flex flex-col items-center gap-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white py-3 rounded-lg transition-colors"
            title="Align Top"
          >
            <AlignVerticalJustifyStart size={16} />
            <span className="text-[9px]">Top</span>
          </button>
          <button
            onClick={() => fabricRef.current?.alignObjects('left')}
            className="flex flex-col items-center gap-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white py-3 rounded-lg transition-colors"
            title="Align Left"
          >
            <AlignHorizontalJustifyStart size={16} />
            <span className="text-[9px]">Left</span>
          </button>
          <button
            onClick={() => fabricRef.current?.alignObjects('middle')}
            className="flex flex-col items-center gap-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white py-3 rounded-lg transition-colors"
            title="Align Middle"
          >
            <AlignVerticalJustifyCenter size={16} />
            <span className="text-[9px]">Middle</span>
          </button>
          <button
            onClick={() => fabricRef.current?.alignObjects('center')}
            className="flex flex-col items-center gap-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white py-3 rounded-lg transition-colors"
            title="Align Center"
          >
            <AlignHorizontalJustifyCenter size={16} />
            <span className="text-[9px]">Center</span>
          </button>
          <button
            onClick={() => fabricRef.current?.alignObjects('bottom')}
            className="flex flex-col items-center gap-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white py-3 rounded-lg transition-colors"
            title="Align Bottom"
          >
            <AlignVerticalJustifyEnd size={16} />
            <span className="text-[9px]">Bottom</span>
          </button>
          <button
            onClick={() => fabricRef.current?.alignObjects('right')}
            className="flex flex-col items-center gap-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white py-3 rounded-lg transition-colors"
            title="Align Right"
          >
            <AlignHorizontalJustifyEnd size={16} />
            <span className="text-[9px]">Right</span>
          </button>
        </div>
      </div>

      {/* Advanced: Dimensions & Position */}
      <div className="p-4 border-b border-white/5">
        <SectionHeader>Advanced</SectionHeader>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <NumberInput
            label="Width"
            value={currentWidth}
            min={1}
            onChange={(v) => {
              const baseW = activeObj?.width ?? 1;
              updateProp('scaleX', v / baseW);
            }}
          />
          <NumberInput
            label="Height"
            value={currentHeight}
            min={1}
            onChange={(v) => {
              const baseH = activeObj?.height ?? 1;
              updateProp('scaleY', v / baseH);
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <NumberInput label="X" value={currentLeft} onChange={(v) => updateProp('left', v)} />
          <NumberInput label="Y" value={currentTop} onChange={(v) => updateProp('top', v)} />
        </div>
        <NumberInput
          label="Rotation"
          value={currentAngle}
          min={0}
          max={360}
          step={1}
          suffix="°"
          onChange={(v) => updateProp('angle', v)}
        />
      </div>

      {/* Flip */}
      <div className="p-4 border-b border-white/5">
        <SectionHeader>Flip</SectionHeader>
        <div className="flex gap-1.5">
          <button
            onClick={() => fabricRef.current?.flipHorizontal()}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs px-3 py-2 rounded-lg transition-colors"
            title="Flip Horizontal"
          >
            <FlipHorizontal2 size={14} /> Horizontal
          </button>
          <button
            onClick={() => fabricRef.current?.flipVertical()}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs px-3 py-2 rounded-lg transition-colors"
            title="Flip Vertical"
          >
            <FlipVertical2 size={14} /> Vertical
          </button>
        </div>
      </div>
    </div>
  );
}
