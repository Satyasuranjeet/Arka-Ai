/**
 * CanvasNode — custom node renderer with per-shape visuals,
 * resize handles, and inline label editing.
 *
 * rectangle / circle / pill  — CSS border-radius
 * diamond / hexagon          — inline SVG polygon (scales with node dimensions)
 * cylinder                   — inline SVG with ellipses + vertical lines
 *
 * Connection handles are hidden by default and revealed on hover (ui-context).
 */

import { useState, useEffect, useRef } from 'react'
import { Handle, Position, NodeResizer, NodeToolbar, useReactFlow } from '@xyflow/react'
import { NODE_COLORS, DEFAULT_NODE_COLOR } from '@/constants/canvas'

// Size and shape only — opacity is controlled via plain CSS in index.css so
// React Flow's connection-state classes (.react-flow__handle-valid etc.) can
// still override visibility without fighting !important overrides.
const HANDLE_CLASS = '!h-2 !w-2 !rounded-full !border-2 !border-[#080809] !bg-white'

// Minimum node dimensions enforced by the NodeResizer.
const MIN_WIDTH  = 60
const MIN_HEIGHT = 40

// ---------------------------------------------------------------------------
// Shape renderers
// ---------------------------------------------------------------------------

function RectangleShape({ color, label, selected }) {
  return (
    <div
      className="flex h-full w-full items-center justify-center rounded-xl border px-3 py-2"
      style={{
        background: color.fill,
        color: color.text,
        borderColor: selected ? color.text : `${color.text}4d`,
      }}
    >
      <span className="pointer-events-none select-none break-words text-center text-sm font-medium">
        {label}
      </span>
    </div>
  )
}

function CircleShape({ color, label, selected }) {
  return (
    <div
      className="flex h-full w-full items-center justify-center rounded-full border px-2 py-2"
      style={{
        background: color.fill,
        color: color.text,
        borderColor: selected ? color.text : `${color.text}4d`,
      }}
    >
      <span className="pointer-events-none select-none break-words text-center text-xs font-medium">
        {label}
      </span>
    </div>
  )
}

// Pill reuses the same rounded-full approach; the 160×60 dimensions produce a
// capsule shape when border-radius exceeds half the shorter dimension.
const PillShape = CircleShape

function DiamondShape({ color, label, selected }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polygon
          points="50,2 98,50 50,98 2,50"
          fill={color.fill}
          stroke={selected ? color.text : `${color.text}4d`}
          strokeWidth="2"
        />
      </svg>
      <span
        className="relative z-10 max-w-[55%] pointer-events-none select-none break-words text-center text-sm font-medium"
        style={{ color: color.text }}
      >
        {label}
      </span>
    </div>
  )
}

function CylinderShape({ color, label, selected }) {
  const stroke = selected ? color.text : `${color.text}4d`
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Body fill */}
        <rect x="1" y="16" width="98" height="68" fill={color.fill} />
        {/* Vertical side lines */}
        <line x1="1"  y1="16" x2="1"  y2="84" stroke={stroke} strokeWidth="1.5" />
        <line x1="99" y1="16" x2="99" y2="84" stroke={stroke} strokeWidth="1.5" />
        {/* Bottom ellipse */}
        <ellipse cx="50" cy="84" rx="49" ry="13" fill={color.fill} stroke={stroke} strokeWidth="1.5" />
        {/* Top ellipse — drawn last so it sits on top of the body */}
        <ellipse cx="50" cy="16" rx="49" ry="13" fill={color.fill} stroke={stroke} strokeWidth="1.5" />
      </svg>
      <span
        className="relative z-10 pointer-events-none select-none break-words text-center text-xs font-medium"
        style={{ color: color.text }}
      >
        {label}
      </span>
    </div>
  )
}

function HexagonShape({ color, label, selected }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Pointy-top hexagon */}
        <polygon
          points="50,2 93,26 93,74 50,98 7,74 7,26"
          fill={color.fill}
          stroke={selected ? color.text : `${color.text}4d`}
          strokeWidth="2"
        />
      </svg>
      <span
        className="relative z-10 max-w-[55%] pointer-events-none select-none break-words text-center text-sm font-medium"
        style={{ color: color.text }}
      >
        {label}
      </span>
    </div>
  )
}

const SHAPE_RENDERERS = {
  rectangle: RectangleShape,
  circle:    CircleShape,
  pill:      PillShape,
  diamond:   DiamondShape,
  cylinder:  CylinderShape,
  hexagon:   HexagonShape,
}

// ---------------------------------------------------------------------------
// Color swatch — one button per NODE_COLORS entry inside the toolbar
// ---------------------------------------------------------------------------

function ColorSwatch({ nc, isActive, onSelect }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      title={nc.label}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="h-5 w-5 flex-shrink-0 rounded-full transition-all duration-150"
      style={{
        background: nc.fill,
        // active: solid ring + tight glow; hover: gentle glow; rest: none
        boxShadow: isActive
          ? `0 0 0 2px ${nc.text}, 0 0 5px 2px ${nc.text}50`
          : hovered
          ? `0 0 0 1px ${nc.text}60, 0 0 4px 1px ${nc.text}40`
          : 'none',
      }}
    />
  )
}

// ---------------------------------------------------------------------------
// Public node component
// ---------------------------------------------------------------------------

export function CanvasNode({ id, data, selected }) {
  const color = data?.color ?? DEFAULT_NODE_COLOR
  const label = data?.label ?? ''
  const shape = data?.shape ?? 'rectangle'

  // ── Inline label editing ─────────────────────────────────────────────────
  const [editing, setEditing] = useState(false)
  const editRef = useRef(null)
  const { updateNodeData } = useReactFlow()

  // When editing opens, seed the contentEditable with the current label,
  // focus it, and select all text so the user can type right away.
  useEffect(() => {
    if (!editing || !editRef.current) return
    const el = editRef.current
    el.textContent = label
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    window.getSelection()?.removeAllRanges()
    window.getSelection()?.addRange(range)
  }, [editing]) // eslint-disable-line react-hooks/exhaustive-deps

  function openEditor(e) {
    if (editing) return
    e.stopPropagation()
    setEditing(true)
  }

  function commitEdit(el) {
    updateNodeData(id, { label: el.textContent?.trim() ?? '' })
    setEditing(false)
  }

  function handleTextKeyDown(e) {
    // Block all key events so they don't reach the canvas.
    e.stopPropagation()
    if (e.key === 'Escape') {
      setEditing(false) // cancel — discard changes
    }
  }

  const ShapeRenderer = SHAPE_RENDERERS[shape] ?? RectangleShape

  return (
    <div className="relative h-full w-full" onDoubleClick={openEditor}>
      {/*
        Color toolbar — floats above the node when selected. Each swatch
        updates both fill and text color via updateNodeData so Liveblocks
        syncs the change to all collaborators in real time.
      */}
      <NodeToolbar isVisible={selected} position={Position.Top} offset={10}>
        <div className="nodrag nopan flex items-center gap-1.5 rounded-full border border-surface-border bg-surface px-2.5 py-1.5 shadow-lg">
          {NODE_COLORS.map((nc) => (
            <ColorSwatch
              key={nc.fill}
              nc={nc}
              isActive={nc.fill === color.fill}
              onSelect={() => updateNodeData(id, { color: nc })}
            />
          ))}
        </div>
      </NodeToolbar>

      {/*
        NodeResizer renders corner + edge handles that update the node's
        style.width / style.height. Liveblocks' onNodesChange handles the
        resulting 'dimensions' change and syncs the new size to storage.
      */}
      <NodeResizer
        isVisible={selected}
        minWidth={MIN_WIDTH}
        minHeight={MIN_HEIGHT}
        handleStyle={{
          width: 8, height: 8, borderRadius: 2,
          background: color.text,
          opacity: 0.7,
          border: 'none',
        }}
        lineStyle={{ borderColor: `${color.text}60` }}
      />

      {/* Shape fills the node; label is hidden while the edit textarea is open */}
      <ShapeRenderer color={color} label={editing ? '' : label} selected={selected} />

      {/* Inline editor — contentEditable div matches the shape's flex-center layout */}
      {editing && (
        <div
          ref={editRef}
          contentEditable="plaintext-only"
          suppressContentEditableWarning
          onBlur={(e) => commitEdit(e.currentTarget)}
          onKeyDown={handleTextKeyDown}
          data-placeholder="Label…"
          className="nodrag nopan absolute inset-0 z-20 flex items-center justify-center bg-transparent text-center text-sm font-medium outline-none cursor-text break-words"
          style={{ color: color.text, padding: '8px' }}
        />
      )}

      {/*
        Each side gets both a target and a source handle at the same position.
        target  = receives incoming connections (drop destination)
        source  = initiates outgoing connections (drag origin)
      */}
      <Handle type="target" position={Position.Top}    id="top-t"    className={HANDLE_CLASS} />
      <Handle type="source" position={Position.Top}    id="top-s"    className={HANDLE_CLASS} />
      <Handle type="target" position={Position.Right}  id="right-t"  className={HANDLE_CLASS} />
      <Handle type="source" position={Position.Right}  id="right-s"  className={HANDLE_CLASS} />
      <Handle type="target" position={Position.Bottom} id="bottom-t" className={HANDLE_CLASS} />
      <Handle type="source" position={Position.Bottom} id="bottom-s" className={HANDLE_CLASS} />
      <Handle type="target" position={Position.Left}   id="left-t"   className={HANDLE_CLASS} />
      <Handle type="source" position={Position.Left}   id="left-s"   className={HANDLE_CLASS} />
    </div>
  )
}
