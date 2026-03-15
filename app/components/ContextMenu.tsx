'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import {
  Copy,
  ClipboardPaste,
  CopyPlus,
  Trash2,
  ArrowUpToLine,
  ArrowUp,
  ArrowDown,
  ArrowDownToLine,
  Group,
  Ungroup,
  Lock,
  Unlock,
} from 'lucide-react';
import type { FabricCanvas } from '@/core/FabricCanvas';

interface ContextMenuProps {
  x: number;
  y: number;
  fabricRef: React.RefObject<FabricCanvas | null>;
  onClose: () => void;
  hasSelection: boolean;
  isGroup: boolean;
  isLocked: boolean;
}

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  disabled?: boolean;
  visible?: boolean;
}

export default function ContextMenu({
  x,
  y,
  fabricRef,
  onClose,
  hasSelection,
  isGroup,
  isLocked,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const exec = useCallback(
    (fn: () => void) => {
      fn();
      onClose();
    },
    [onClose],
  );

  // Adjust position to keep menu within viewport
  const [pos, setPos] = React.useState({ x, y });

  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    let adjustedX = x;
    let adjustedY = y;

    if (x + rect.width > window.innerWidth) {
      adjustedX = window.innerWidth - rect.width - 8;
    }
    if (y + rect.height > window.innerHeight) {
      adjustedY = window.innerHeight - rect.height - 8;
    }

    if (adjustedX !== x || adjustedY !== y) {
      setPos({ x: adjustedX, y: adjustedY });
    }
  }, [x, y]);

  // Click-outside and Escape listeners
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const needsSelection = !hasSelection;

  const sections: (MenuItem | 'separator')[][] = [
    [
      {
        label: 'Copy',
        icon: <Copy size={14} />,
        shortcut: '\u2318C',
        action: () => exec(() => fabricRef.current?.copy()),
        disabled: needsSelection,
      },
      {
        label: 'Paste',
        icon: <ClipboardPaste size={14} />,
        shortcut: '\u2318V',
        action: () => exec(() => fabricRef.current?.paste()),
      },
      {
        label: 'Duplicate',
        icon: <CopyPlus size={14} />,
        shortcut: '\u2318D',
        action: () => exec(() => fabricRef.current?.duplicateSelected()),
        disabled: needsSelection,
      },
      {
        label: 'Delete',
        icon: <Trash2 size={14} />,
        shortcut: 'Del',
        action: () => exec(() => fabricRef.current?.deleteSelected()),
        disabled: needsSelection,
      },
    ],
    [
      {
        label: 'Bring to Front',
        icon: <ArrowUpToLine size={14} />,
        action: () => exec(() => fabricRef.current?.bringToFront()),
        disabled: needsSelection,
      },
      {
        label: 'Bring Forward',
        icon: <ArrowUp size={14} />,
        action: () => exec(() => fabricRef.current?.bringForward()),
        disabled: needsSelection,
      },
      {
        label: 'Send Backward',
        icon: <ArrowDown size={14} />,
        action: () => exec(() => fabricRef.current?.sendBackwards()),
        disabled: needsSelection,
      },
      {
        label: 'Send to Back',
        icon: <ArrowDownToLine size={14} />,
        action: () => exec(() => fabricRef.current?.sendToBack()),
        disabled: needsSelection,
      },
    ],
    [
      {
        label: 'Group',
        icon: <Group size={14} />,
        shortcut: '\u2318G',
        action: () => exec(() => fabricRef.current?.groupSelected()),
        disabled: needsSelection,
        visible: hasSelection && !isGroup,
      },
      {
        label: 'Ungroup',
        icon: <Ungroup size={14} />,
        shortcut: '\u2318\u21E7G',
        action: () => exec(() => fabricRef.current?.ungroupSelected()),
        visible: isGroup,
      },
    ],
    [
      {
        label: isLocked ? 'Unlock' : 'Lock',
        icon: isLocked ? <Unlock size={14} /> : <Lock size={14} />,
        action: () =>
          exec(() => {
            const obj = fabricRef.current?.canvas.getActiveObject() as any;
            if (obj?.id) {
              fabricRef.current?.toggleLock(obj.id);
            }
          }),
      },
    ],
  ];

  return (
    <div
      ref={menuRef}
      className="absolute z-50 min-w-[200px] py-1 bg-[var(--surface-3)] border border-[var(--ui-10)] rounded-lg shadow-xl shadow-black/50"
      style={{ left: pos.x, top: pos.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {sections.map((section, sIdx) => {
        const visibleItems = section.filter(
          (item): item is MenuItem =>
            typeof item !== 'string' && (item.visible === undefined || item.visible),
        );

        if (visibleItems.length === 0) return null;

        return (
          <React.Fragment key={sIdx}>
            {sIdx > 0 && <div className="h-px bg-[var(--ui-10)] my-1" />}
            {visibleItems.map((item) => (
              <div
                key={item.label}
                className={`px-3 py-2 text-xs text-[var(--ui-80)] flex items-center justify-between cursor-pointer ${
                  item.disabled
                    ? 'opacity-50 pointer-events-none'
                    : 'hover:bg-violet-500/20'
                }`}
                onClick={item.action}
              >
                <span className="flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </span>
                {item.shortcut && (
                  <span className="text-[var(--ui-30)] text-[10px] ml-4">{item.shortcut}</span>
                )}
              </div>
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
}
