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
