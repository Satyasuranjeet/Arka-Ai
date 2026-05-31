/**
 * ShapePanel — floating pill-shaped toolbar at the bottom-center of the canvas.
 *
 * Renders a draggable button for each supported node shape. Dragging a button
 * onto the canvas starts a native HTML5 drag with a JSON payload that includes
 * the shape name and its default width/height. CanvasWrapper reads this payload
 * in its onDrop handler to create a new Liveblocks/React Flow node.
 */

import {
  RectangleHorizontal,
  Diamond,
  Circle,
  Pill,
  Cylinder,
  Hexagon,
} from 'lucide-react'
import { DEFAULT_NODE_COLOR } from '@/constants/canvas'

// ---------------------------------------------------------------------------
// Drag ghost — builds an offscreen DOM element that matches the dragged shape
// so the browser can use it as the native drag image. The element is removed
// after the browser captures it (next animation frame).
// ---------------------------------------------------------------------------

function buildGhostElement(shape, width, height) {
  const { fill, text } = DEFAULT_NODE_COLOR
  const border = `${text}80` // ~50 % opacity border

  const el = document.createElement('div')
  el.style.cssText = `
    position: fixed; top: -9999px; left: -9999px;
    width: ${width}px; height: ${height}px;
    pointer-events: none; opacity: 0.85; overflow: hidden;
  `

  if (shape === 'rectangle') {
    el.style.background = fill
    el.style.borderRadius = '12px'
    el.style.border = `1px solid ${border}`
  } else if (shape === 'circle' || shape === 'pill') {
    el.style.background = fill
    el.style.borderRadius = '9999px'
    el.style.border = `1px solid ${border}`
  } else {
    const inner = {
      diamond: `<polygon points="50,2 98,50 50,98 2,50" fill="${fill}" stroke="${border}" stroke-width="2"/>`,
      hexagon: `<polygon points="50,2 93,26 93,74 50,98 7,74 7,26" fill="${fill}" stroke="${border}" stroke-width="2"/>`,
      cylinder: `
        <rect x="1" y="16" width="98" height="68" fill="${fill}"/>
        <line x1="1"  y1="16" x2="1"  y2="84" stroke="${border}" stroke-width="1.5"/>
        <line x1="99" y1="16" x2="99" y2="84" stroke="${border}" stroke-width="1.5"/>
        <ellipse cx="50" cy="84" rx="49" ry="13" fill="${fill}" stroke="${border}" stroke-width="1.5"/>
        <ellipse cx="50" cy="16" rx="49" ry="13" fill="${fill}" stroke="${border}" stroke-width="1.5"/>
      `,
    }[shape] ?? ''
    el.innerHTML = `<svg viewBox="0 0 100 100" width="${width}" height="${height}"
      preserveAspectRatio="none">${inner}</svg>`
  }

  return el
}

// ---------------------------------------------------------------------------
// Shape definitions — name, default canvas dimensions, and toolbar icon.
// Sizes follow the spec: rectangles wider than tall, circles square,
// diamonds slightly larger for label room.
// ---------------------------------------------------------------------------

const SHAPES = [
  { shape: 'rectangle', width: 180, height: 80,  Icon: RectangleHorizontal, label: 'Rectangle' },
  { shape: 'diamond',   width: 120, height: 120, Icon: Diamond,             label: 'Diamond'   },
  { shape: 'circle',    width: 80,  height: 80,  Icon: Circle,              label: 'Circle'    },
  { shape: 'pill',      width: 160, height: 60,  Icon: Pill,                label: 'Pill'      },
  { shape: 'cylinder',  width: 100, height: 100, Icon: Cylinder,            label: 'Cylinder'  },
  { shape: 'hexagon',   width: 110, height: 110, Icon: Hexagon,             label: 'Hexagon'   },
]

// ---------------------------------------------------------------------------
// Individual draggable shape button
// ---------------------------------------------------------------------------

function ShapeButton({ shape, width, height, Icon, label }) {
  function handleDragStart(event) {
    event.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify({ shape, width, height }),
    )
    event.dataTransfer.effectAllowed = 'copy'

    // Build an offscreen ghost element matching the dragged shape and use it
    // as the native drag image so the cursor carries a shape preview.
    // The ghost is appended to the body so the browser can snapshot it, then
    // removed on the next frame (the browser retains its own copy).
    const ghost = buildGhostElement(shape, width, height)
    document.body.appendChild(ghost)
    event.dataTransfer.setDragImage(ghost, width / 2, height / 2)
    requestAnimationFrame(() => document.body.removeChild(ghost))
  }

  return (
    <button
      draggable
      onDragStart={handleDragStart}
      title={label}
      className="flex h-8 w-8 cursor-grab items-center justify-center rounded-lg text-copy-secondary transition-colors hover:bg-elevated hover:text-copy-primary active:cursor-grabbing"
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Panel wrapper — absolute-positioned, stays fixed over the canvas
// ---------------------------------------------------------------------------

export function ShapePanel() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-surface-border bg-surface px-3 py-2 shadow-lg">
        {SHAPES.map((s) => (
          <ShapeButton key={s.shape} {...s} />
        ))}
      </div>
    </div>
  )
}
