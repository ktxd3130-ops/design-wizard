'use client';

import React, { useMemo, useCallback } from 'react';
import { FabricCanvas } from '@/core/FabricCanvas';
import { DesignState } from '@/core/types';
import { GOOGLE_FONTS } from '@/core/GoogleFonts';
import {
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  FlipHorizontal2,
  FlipVertical2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Image as ImageIcon,
  Palette,
  RotateCw,
  Move,
  Maximize,
  SlidersHorizontal,
  CaseSensitive,
  Eraser,
} from 'lucide-react';

interface InspectorPanelProps {
  fabricRef: React.RefObject<FabricCanvas | null>;
  designState: DesignState;
}

// ---------------------------------------------------------------------------
// Reusable tiny components
// ---------------------------------------------------------------------------

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--ui-60)] mb-2">
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
      <span className="text-[10px] text-[var(--ui-40)]">{label}</span>
      <div className="relative">
        <input
          type="number"
          className="w-full bg-[var(--ui-10)] border border-[var(--ui-5)] rounded text-xs text-[var(--ui-80)] px-2 py-1 pr-6 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          value={Math.round(value * 100) / 100}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--ui-30)]">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function IconButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-violet-600/60 text-[var(--ui-100)]'
          : 'bg-[var(--ui-5)] hover:bg-[var(--ui-10)] text-[var(--ui-60)] hover:text-[var(--ui-80)]'
      }`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function InspectorPanel({ fabricRef, designState }: InspectorPanelProps) {
  // Derive selected object
  const selectedObject = useMemo(() => {
    if (!designState.activeObjectId) return null;
    return designState.objects.find((o) => o.id === designState.activeObjectId) ?? null;
  }, [designState.activeObjectId, designState.objects]);

  // Live fabric reference for reading current values
  const getActive = useCallback(() => {
    return fabricRef.current?.canvas.getActiveObject() as any;
  }, [fabricRef]);

  const updateProp = useCallback(
    (key: string, value: any) => {
      fabricRef.current?.updateActiveObjectProperty(key, value);
    },
    [fabricRef],
  );

  // -----------------------------------------------------------------------
  // Canvas properties (no selection)
  // -----------------------------------------------------------------------
  if (!selectedObject) {
    return (
      <div className="w-full h-full bg-[var(--surface-2)] text-[var(--ui-100)] overflow-y-auto">
        <div className="p-4 border-b border-[var(--ui-5)]">
          <SectionHeader>Canvas</SectionHeader>
          <div className="flex items-center gap-2 text-xs text-[var(--ui-70)] mb-3">
            <Maximize size={14} className="text-[var(--ui-40)]" />
            <span>
              {designState.canvasWidth} &times; {designState.canvasHeight} px
            </span>
          </div>

          <label className="flex items-center gap-2 text-xs text-[var(--ui-70)]">
            <Palette size={14} className="text-[var(--ui-40)]" />
            <span>Background</span>
            <input
              type="color"
              className="ml-auto w-7 h-7 rounded border border-[var(--ui-10)] bg-transparent cursor-pointer"
              value={designState.backgroundColor || '#ffffff'}
              onChange={(e) => {
                if (fabricRef.current) {
                  fabricRef.current.canvas.backgroundColor = e.target.value;
                  fabricRef.current.canvas.renderAll();
                }
              }}
            />
          </label>
        </div>

        <div className="p-4 text-center text-xs text-[var(--ui-30)]">
          Select an object on the canvas to edit its properties.
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Object selected – read live values
  // -----------------------------------------------------------------------
  const activeObj = getActive();
  const objType = selectedObject.type;
  const isText = objType === 'text' || objType === 'textbox' || objType === 'i-text';
  const isImage = objType === 'image';

  const currentLeft = activeObj?.left ?? 0;
  const currentTop = activeObj?.top ?? 0;
  const currentWidth = (activeObj?.width ?? 0) * (activeObj?.scaleX ?? 1);
  const currentHeight = (activeObj?.height ?? 0) * (activeObj?.scaleY ?? 1);
  const currentAngle = activeObj?.angle ?? 0;
  const currentOpacity = Math.round((activeObj?.opacity ?? 1) * 100);

  return (
    <div className="w-full h-full bg-[var(--surface-2)] text-[var(--ui-100)] overflow-y-auto">
      {/* ---- Position ---- */}
      <div className="p-4 border-b border-[var(--ui-5)]">
        <SectionHeader>
          <span className="inline-flex items-center gap-1">
            <Move size={12} /> Position
          </span>
        </SectionHeader>
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="X" value={currentLeft} onChange={(v) => updateProp('left', v)} />
          <NumberInput label="Y" value={currentTop} onChange={(v) => updateProp('top', v)} />
        </div>
      </div>

      {/* ---- Size ---- */}
      <div className="p-4 border-b border-[var(--ui-5)]">
        <SectionHeader>
          <span className="inline-flex items-center gap-1">
            <Maximize size={12} /> Size
          </span>
        </SectionHeader>
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="W"
            value={currentWidth}
            min={1}
            onChange={(v) => {
              const baseW = activeObj?.width ?? 1;
              updateProp('scaleX', v / baseW);
            }}
          />
          <NumberInput
            label="H"
            value={currentHeight}
            min={1}
            onChange={(v) => {
              const baseH = activeObj?.height ?? 1;
              updateProp('scaleY', v / baseH);
            }}
          />
        </div>
      </div>

      {/* ---- Rotation ---- */}
      <div className="p-4 border-b border-[var(--ui-5)]">
        <SectionHeader>
          <span className="inline-flex items-center gap-1">
            <RotateCw size={12} /> Rotation
          </span>
        </SectionHeader>
        <NumberInput
          label="Angle"
          value={currentAngle}
          min={0}
          max={360}
          step={1}
          suffix="°"
          onChange={(v) => updateProp('angle', v)}
        />
      </div>

      {/* ---- Opacity ---- */}
      <div className="p-4 border-b border-[var(--ui-5)]">
        <SectionHeader>
          <span className="inline-flex items-center gap-1">
            <SlidersHorizontal size={12} /> Opacity
          </span>
        </SectionHeader>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={currentOpacity}
            onChange={(e) => fabricRef.current?.setOpacity(parseInt(e.target.value, 10))}
            className="flex-1 accent-violet-500"
          />
          <span className="text-xs text-[var(--ui-60)] w-8 text-right">{currentOpacity}%</span>
        </div>
      </div>

      {/* ---- Alignment ---- */}
      <div className="p-4 border-b border-[var(--ui-5)]">
        <SectionHeader>Align</SectionHeader>
        <div className="flex gap-1">
          <IconButton title="Align Left" onClick={() => fabricRef.current?.alignObjects('left')}>
            <AlignHorizontalJustifyStart size={14} />
          </IconButton>
          <IconButton title="Align Center" onClick={() => fabricRef.current?.alignObjects('center')}>
            <AlignHorizontalJustifyCenter size={14} />
          </IconButton>
          <IconButton title="Align Right" onClick={() => fabricRef.current?.alignObjects('right')}>
            <AlignHorizontalJustifyEnd size={14} />
          </IconButton>
          <IconButton title="Align Top" onClick={() => fabricRef.current?.alignObjects('top')}>
            <AlignVerticalJustifyStart size={14} />
          </IconButton>
          <IconButton title="Align Middle" onClick={() => fabricRef.current?.alignObjects('middle')}>
            <AlignVerticalJustifyCenter size={14} />
          </IconButton>
          <IconButton title="Align Bottom" onClick={() => fabricRef.current?.alignObjects('bottom')}>
            <AlignVerticalJustifyEnd size={14} />
          </IconButton>
        </div>
      </div>

      {/* ---- Flip ---- */}
      <div className="p-4 border-b border-[var(--ui-5)]">
        <SectionHeader>Flip</SectionHeader>
        <div className="flex gap-1">
          <IconButton title="Flip Horizontal" onClick={() => fabricRef.current?.flipHorizontal()}>
            <FlipHorizontal2 size={14} />
          </IconButton>
          <IconButton title="Flip Vertical" onClick={() => fabricRef.current?.flipVertical()}>
            <FlipVertical2 size={14} />
          </IconButton>
        </div>
      </div>

      {/* ================================================================ */}
      {/* TEXT-SPECIFIC PROPERTIES                                         */}
      {/* ================================================================ */}
      {isText && (
        <>
          {/* Font Family */}
          <div className="p-4 border-b border-[var(--ui-5)]">
            <SectionHeader>
              <span className="inline-flex items-center gap-1">
                <Type size={12} /> Font
              </span>
            </SectionHeader>

            <select
              className="w-full bg-[var(--ui-10)] border border-[var(--ui-5)] rounded text-xs text-[var(--ui-80)] px-2 py-1.5 mb-2"
              value={activeObj?.fontFamily ?? 'Inter'}
              onChange={(e) => fabricRef.current?.updateFontFamily(e.target.value)}
            >
              {GOOGLE_FONTS.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <NumberInput
                label="Size"
                value={activeObj?.fontSize ?? 24}
                min={1}
                max={800}
                onChange={(v) => updateProp('fontSize', v)}
              />
              <label className="flex flex-col gap-0.5">
                <span className="text-[10px] text-[var(--ui-40)]">Weight</span>
                <select
                  className="w-full bg-[var(--ui-10)] border border-[var(--ui-5)] rounded text-xs text-[var(--ui-80)] px-2 py-1"
                  value={activeObj?.fontWeight ?? 'normal'}
                  onChange={(e) => updateProp('fontWeight', e.target.value)}
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                  <option value="300">300</option>
                  <option value="400">400</option>
                  <option value="500">500</option>
                  <option value="600">600</option>
                  <option value="700">700</option>
                  <option value="800">800</option>
                  <option value="900">900</option>
                </select>
              </label>
            </div>

            {/* Text Align */}
            <div className="flex gap-1 mb-2">
              <IconButton
                title="Align Left"
                active={activeObj?.textAlign === 'left'}
                onClick={() => updateProp('textAlign', 'left')}
              >
                <AlignLeft size={14} />
              </IconButton>
              <IconButton
                title="Align Center"
                active={activeObj?.textAlign === 'center'}
                onClick={() => updateProp('textAlign', 'center')}
              >
                <AlignCenter size={14} />
              </IconButton>
              <IconButton
                title="Align Right"
                active={activeObj?.textAlign === 'right'}
                onClick={() => updateProp('textAlign', 'right')}
              >
                <AlignRight size={14} />
              </IconButton>
              <IconButton
                title="Justify"
                active={activeObj?.textAlign === 'justify'}
                onClick={() => updateProp('textAlign', 'justify')}
              >
                <AlignJustify size={14} />
              </IconButton>
            </div>
          </div>

          {/* Colors & Stroke */}
          <div className="p-4 border-b border-[var(--ui-5)]">
            <SectionHeader>
              <span className="inline-flex items-center gap-1">
                <Palette size={12} /> Color &amp; Stroke
              </span>
            </SectionHeader>

            <div className="flex items-center gap-3 mb-2">
              <label className="flex items-center gap-1.5 text-xs text-[var(--ui-70)]">
                <span className="text-[10px] text-[var(--ui-40)]">Fill</span>
                <input
                  type="color"
                  className="w-6 h-6 rounded border border-[var(--ui-10)] bg-transparent cursor-pointer"
                  value={activeObj?.fill ?? '#000000'}
                  onChange={(e) => updateProp('fill', e.target.value)}
                />
              </label>
              <label className="flex items-center gap-1.5 text-xs text-[var(--ui-70)]">
                <span className="text-[10px] text-[var(--ui-40)]">Stroke</span>
                <input
                  type="color"
                  className="w-6 h-6 rounded border border-[var(--ui-10)] bg-transparent cursor-pointer"
                  value={activeObj?.stroke ?? '#000000'}
                  onChange={(e) => updateProp('stroke', e.target.value)}
                />
              </label>
            </div>

            <NumberInput
              label="Stroke Width"
              value={activeObj?.strokeWidth ?? 0}
              min={0}
              max={20}
              step={0.5}
              onChange={(v) => updateProp('strokeWidth', v)}
            />
          </div>

          {/* Spacing */}
          <div className="p-4 border-b border-[var(--ui-5)]">
            <SectionHeader>Spacing</SectionHeader>

            <label className="flex flex-col gap-0.5 mb-3">
              <span className="text-[10px] text-[var(--ui-40)]">
                Line Height ({(activeObj?.lineHeight ?? 1.2).toFixed(1)})
              </span>
              <input
                type="range"
                min={0.5}
                max={3.0}
                step={0.1}
                value={activeObj?.lineHeight ?? 1.2}
                onChange={(e) => updateProp('lineHeight', parseFloat(e.target.value))}
                className="accent-violet-500"
              />
            </label>

            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] text-[var(--ui-40)]">
                Letter Spacing ({activeObj?.charSpacing ?? 0})
              </span>
              <input
                type="range"
                min={-200}
                max={800}
                step={10}
                value={activeObj?.charSpacing ?? 0}
                onChange={(e) => updateProp('charSpacing', parseInt(e.target.value, 10))}
                className="accent-violet-500"
              />
            </label>
          </div>

          {/* Text Transform */}
          <div className="p-4 border-b border-[var(--ui-5)]">
            <SectionHeader>
              <span className="inline-flex items-center gap-1">
                <CaseSensitive size={12} /> Text Transform
              </span>
            </SectionHeader>
            <div className="flex gap-1">
              <IconButton
                title="UPPERCASE"
                onClick={() => {
                  const text = activeObj?.text;
                  if (text) updateProp('text', text.toUpperCase());
                }}
              >
                <span className="text-[10px] font-bold">AA</span>
              </IconButton>
              <IconButton
                title="lowercase"
                onClick={() => {
                  const text = activeObj?.text;
                  if (text) updateProp('text', text.toLowerCase());
                }}
              >
                <span className="text-[10px] font-bold">aa</span>
              </IconButton>
              <IconButton
                title="Capitalize"
                onClick={() => {
                  const text = activeObj?.text as string | undefined;
                  if (text) {
                    const capitalized = text.replace(
                      /\b\w/g,
                      (c: string) => c.toUpperCase(),
                    );
                    updateProp('text', capitalized);
                  }
                }}
              >
                <span className="text-[10px] font-bold">Aa</span>
              </IconButton>
            </div>
          </div>
        </>
      )}

      {/* ================================================================ */}
      {/* IMAGE-SPECIFIC PROPERTIES                                        */}
      {/* ================================================================ */}
      {isImage && (
        <div className="p-4 border-b border-[var(--ui-5)]">
          <SectionHeader>
            <span className="inline-flex items-center gap-1">
              <ImageIcon size={12} /> Filters
            </span>
          </SectionHeader>

          <div className="flex flex-wrap gap-1 mb-2">
            <IconButton
              title="Black & White"
              onClick={() => fabricRef.current?.applyImageFilter('grayscale', 1)}
            >
              <span className="text-[10px] font-semibold">B&amp;W</span>
            </IconButton>
            <IconButton
              title="Sepia"
              onClick={() => fabricRef.current?.applyImageFilter('sepia', 1)}
            >
              <span className="text-[10px] font-semibold">Sepia</span>
            </IconButton>
            <IconButton
              title="Invert"
              onClick={() => fabricRef.current?.applyImageFilter('invert', 1)}
            >
              <span className="text-[10px] font-semibold">Invert</span>
            </IconButton>
          </div>

          <button
            type="button"
            onClick={() => fabricRef.current?.resetImageFilters()}
            className="flex items-center gap-1.5 text-xs text-[var(--ui-60)] hover:text-[var(--ui-80)] bg-[var(--ui-5)] hover:bg-[var(--ui-10)] rounded px-2.5 py-1.5 transition-colors"
          >
            <Eraser size={12} />
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
