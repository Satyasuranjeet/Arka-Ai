/**
 * LiveCursors — renders remote participants' live cursor positions.
 *
 * Must be rendered as a direct child of <ReactFlow> so it sits inside the
 * ReactFlow container (position: relative).  useViewport() provides the
 * current pan/zoom transform so canvas coordinates map to correct screen
 * positions within that container.
 *
 * Only renders cursors for OTHER users — never the local user.
 */

import { useOthers, useSelf } from '@liveblocks/react'
import { useViewport } from '@xyflow/react'
import { Loader2 } from 'lucide-react'

// ---------------------------------------------------------------------------
// SVG cursor pointer icon
// ---------------------------------------------------------------------------

function CursorPointer({ color }) {
  return (
    <svg
      width="14"
      height="18"
      viewBox="0 0 14 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 1 L1 14.5 L4.5 10.5 L7.5 17.5 L9.5 16.5 L6.5 9.5 L12 9.5 Z"
        fill={color}
        stroke="rgba(0,0,0,0.45)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// LiveCursors — rendered inside <ReactFlow> children
// ---------------------------------------------------------------------------

export function LiveCursors() {
  const self   = useSelf()
  const others = useOthers()

  // useViewport returns { x, y, zoom } — the current ReactFlow viewport transform.
  // For a canvas point (cx, cy), its pixel position within the ReactFlow
  // container is:  screenX = cx * zoom + x,  screenY = cy * zoom + y
  const { x: vpX, y: vpY, zoom } = useViewport()

  const currentUserId = self?.id

  const activeCursors = others.filter(
    (u) => u.id !== currentUserId && u.presence.cursor != null,
  )

  if (activeCursors.length === 0) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {activeCursors.map((user) => {
        const { x, y } = user.presence.cursor
        const screenX  = x * zoom + vpX
        const screenY  = y * zoom + vpY
        const color    = user.info?.color ?? '#808090'
        const name     = user.info?.name  ?? 'Anonymous'
        const thinking = user.presence.thinking === true

        return (
          <div
            key={user.connectionId}
            style={{
              position: 'absolute',
              left: screenX,
              top: screenY,
              pointerEvents: 'none',
              userSelect: 'none',
              zIndex: 9999,
            }}
          >
            <CursorPointer color={color} />
            {/* Name badge — offset slightly to the right of the pointer tip */}
            <div
              style={{ background: color, marginLeft: 10, marginTop: 1 }}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white whitespace-nowrap shadow-sm"
            >
              {thinking && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
              {name}
            </div>
          </div>
        )
      })}
    </div>
  )
}
