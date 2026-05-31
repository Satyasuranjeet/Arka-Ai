/**
 * CanvasNode — custom node renderer with per-shape visuals.
 *
 * rectangle / circle / pill  — CSS border-radius
 * diamond / hexagon          — inline SVG polygon (scales with node dimensions)
 * cylinder                   — inline SVG with ellipses + vertical lines
 *
 * Connection handles are hidden by default and revealed on hover (ui-context).
 */

import { Handle, Position } from '@xyflow/react'
import { DEFAULT_NODE_COLOR } from '@/constants/canvas'

// Size and shape only — opacity is controlled via plain CSS in index.css so
// React Flow's connection-state classes (.react-flow__handle-valid etc.) can
// still override visibility without fighting !important overrides.
const HANDLE_CLASS = '!h-2 !w-2 !rounded-full !border-2 !border-white !bg-transparent'

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
// Public node component
// ---------------------------------------------------------------------------

export function CanvasNode({ data, selected }) {
  const color = data?.color ?? DEFAULT_NODE_COLOR
  const label = data?.label ?? ''
  const shape = data?.shape ?? 'rectangle'

  const ShapeRenderer = SHAPE_RENDERERS[shape] ?? RectangleShape

  return (
    <div className="relative h-full w-full">
      <ShapeRenderer color={color} label={label} selected={selected} />
      {/*
        Each side gets both a target and a source handle at the same position.
        target  = receives incoming connections (drop destination)
        source  = initiates outgoing connections (drag origin)
        This is the standard React Flow pattern for bidirectional edges and
        removes the need for connectionMode="loose".
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
