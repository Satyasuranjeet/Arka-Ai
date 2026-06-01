/**
 * CanvasEdge — custom edge renderer.
 *
 * - Orthogonal step routing via getSmoothStepPath (borderRadius for slight rounding)
 * - Per-edge inline SVG <defs> arrowhead marker so stroke + marker colour sync
 * - Wide invisible interaction path (strokeWidth 20) for an easy click target
 * - Hover / selected → brightened stroke (#f8fafc); rest → muted (#70708a)
 * - EdgeLabelRenderer positions the label at the path midpoint
 * - Double-click (path or label) → inline editing input
 * - Input width grows with typed text; blur / Enter / Escape → commit
 * - Saved label shown as a pill badge; empty label shows a faint "+" hint
 * - All interactive label elements carry nodrag + nopan
 */

import { useState } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
} from '@xyflow/react'

export function CanvasEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) {
  const [hovered, setHovered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState('')
  const { updateEdgeData }    = useReactFlow()

  const label      = data?.label ?? ''
  const isActive   = selected || hovered
  const strokeColor = isActive ? '#f8fafc' : '#70708a'

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  })

  // Unique marker ID so per-edge colour changes never bleed across edges
  const markerId = `canvas-arrow-${id}`

  function openEditor(e) {
    e.stopPropagation()
    setDraft(label)
    setEditing(true)
  }

  function commitEdit() {
    updateEdgeData(id, { label: draft.trim() })
    setEditing(false)
  }

  function handleKeyDown(e) {
    e.stopPropagation()
    if (e.key === 'Enter' || e.key === 'Escape') commitEdit()
  }

  // Input grows with content; minimum 48 px
  const inputWidth = Math.max(48, draft.length * 8 + 24)

  return (
    <>
      {/* Inline arrowhead — unique per edge so colour animates with stroke */}
      <defs>
        <marker
          id={markerId}
          markerWidth="8"
          markerHeight="8"
          refX="5"
          refY="3"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 0 L 6 3 L 0 6 z"
            fill={strokeColor}
            style={{ transition: 'fill 0.15s' }}
          />
        </marker>
      </defs>

      {/* Invisible wide path — expands click / hover hit area */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDoubleClick={openEditor}
        style={{ cursor: 'pointer' }}
      />

      {/* Visible edge line */}
      <BaseEdge
        path={edgePath}
        markerEnd={`url(#${markerId})`}
        style={{
          stroke: strokeColor,
          strokeWidth: 1.5,
          strokeLinecap: 'round',
          transition: 'stroke 0.15s',
        }}
      />

      {/* Label at midpoint, rendered outside the SVG via EdgeLabelRenderer */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
          onDoubleClick={openEditor}
        >
          {editing ? (
            <input
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              className="nodrag nopan rounded-full border border-surface-border bg-surface text-xs text-copy-primary outline-none px-2 py-0.5 text-center"
              style={{ width: inputWidth, transition: 'width 0.08s' }}
            />
          ) : label ? (
            <span className="rounded-full border border-surface-border bg-surface text-xs text-copy-secondary px-2 py-0.5 select-none cursor-default">
              {label}
            </span>
          ) : (
            <span
              className="rounded-full border border-surface-border bg-surface text-xs text-copy-muted px-2 py-0.5 select-none cursor-pointer transition-opacity"
              style={{ opacity: isActive ? 0.65 : 0 }}
              title="Double-click to add a label"
            >
              + label
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
