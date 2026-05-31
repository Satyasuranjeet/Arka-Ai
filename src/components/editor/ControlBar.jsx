/**
 * ControlBar — floating pill-shaped control bar at the bottom-left of the canvas.
 *
 * Two visual groups separated by a thin divider:
 *   Zoom:    zoom out | fit view | zoom in
 *   History: undo | redo
 *
 * Zoom actions call the React Flow instance directly via the rfInstance ref.
 * History actions are the Liveblocks undo/redo callbacks passed from LiveCanvas.
 * Disabled buttons are visually dimmed and non-interactive.
 */

import { ZoomIn, ZoomOut, Maximize2, Undo2, Redo2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const ANIM = { duration: 200 }

export function ControlBar({ rfInstance, undo, redo, canUndo, canRedo }) {
  return (
    <div className="nodrag nopan pointer-events-auto absolute bottom-6 left-4 z-10">
      <div className="flex items-center rounded-full border border-surface-border bg-surface px-1 py-1 shadow-lg shadow-black/30">
        {/* Zoom group */}
        <CtrlBtn onClick={() => rfInstance.current?.zoomOut(ANIM)} title="Zoom out (-)">
          <ZoomOut size={16} />
        </CtrlBtn>
        <CtrlBtn onClick={() => rfInstance.current?.fitView(ANIM)} title="Fit view">
          <Maximize2 size={16} />
        </CtrlBtn>
        <CtrlBtn onClick={() => rfInstance.current?.zoomIn(ANIM)} title="Zoom in (+)">
          <ZoomIn size={16} />
        </CtrlBtn>

        {/* Divider */}
        <div className="mx-2 h-5 w-px bg-surface-border" aria-hidden />

        {/* History group */}
        <CtrlBtn onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          <Undo2 size={16} />
        </CtrlBtn>
        <CtrlBtn onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
          <Redo2 size={16} />
        </CtrlBtn>
      </div>
    </div>
  )
}

function CtrlBtn({ onClick, disabled = false, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full text-copy-secondary transition-colors',
        disabled
          ? 'cursor-not-allowed opacity-30'
          : 'cursor-pointer hover:bg-elevated hover:text-copy-primary',
      )}
    >
      {children}
    </button>
  )
}
