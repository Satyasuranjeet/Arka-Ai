/**
 * StarterTemplatesModal — template selection dialog.
 *
 * Renders a grid of template cards, each with:
 *   - A lightweight SVG preview (no React Flow instance)
 *   - Name and description
 *   - An "Import Template" button
 *
 * Calling onImport(template) fully replaces the active canvas state via the
 * parent's Liveblocks change handlers, then closes the dialog.
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CANVAS_TEMPLATES } from './starterTemplates'

// ---------------------------------------------------------------------------
// Lightweight SVG preview — no React Flow, pure SVG shapes + lines
// ---------------------------------------------------------------------------

const VW = 280
const VH = 148
const PAD = 10

function TemplatePreview({ nodes, edges }) {
  if (!nodes.length) return null

  // Compute bounding box of all node positions
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const n of nodes) {
    const w = n.style?.width ?? 140
    const h = n.style?.height ?? 56
    minX = Math.min(minX, n.position.x)
    minY = Math.min(minY, n.position.y)
    maxX = Math.max(maxX, n.position.x + w)
    maxY = Math.max(maxY, n.position.y + h)
  }

  const srcW = maxX - minX || 1
  const srcH = maxY - minY || 1
  const availW = VW - PAD * 2
  const availH = VH - PAD * 2
  const scale = Math.min(availW / srcW, availH / srcH)

  // Centre the scaled content inside the viewBox
  const scaledW = srcW * scale
  const scaledH = srcH * scale
  const dx = PAD + (availW - scaledW) / 2
  const dy = PAD + (availH - scaledH) / 2

  function toV(x, y) {
    return [(x - minX) * scale + dx, (y - minY) * scale + dy]
  }

  // Pre-compute node centres for edge line endpoints
  const centers = {}
  for (const n of nodes) {
    const nw = n.style?.width ?? 140
    const nh = n.style?.height ?? 56
    const [cx, cy] = toV(n.position.x + nw / 2, n.position.y + nh / 2)
    centers[n.id] = [cx, cy]
  }

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      className="h-full w-full"
      aria-hidden
    >
      {/* Edges — drawn behind nodes as simple lines */}
      {edges.map((e) => {
        const s = centers[e.source]
        const t = centers[e.target]
        if (!s || !t) return null
        return (
          <line
            key={e.id}
            x1={s[0]} y1={s[1]}
            x2={t[0]} y2={t[1]}
            stroke="#3a3a42"
            strokeWidth={1}
          />
        )
      })}

      {/* Nodes */}
      {nodes.map((n) => {
        const nw = n.style?.width ?? 140
        const nh = n.style?.height ?? 56
        const [x, y] = toV(n.position.x, n.position.y)
        const w = nw * scale
        const h = nh * scale
        return (
          <PreviewNode
            key={n.id}
            shape={n.data.shape}
            x={x} y={y} w={w} h={h}
            fill={n.data.color.fill}
            stroke={n.data.color.text + '99'}
          />
        )
      })}
    </svg>
  )
}

function PreviewNode({ shape, x, y, w, h, fill, stroke }) {
  const sw = 0.8

  if (shape === 'circle' || shape === 'pill') {
    return (
      <rect x={x} y={y} width={w} height={h}
        rx={h / 2} ry={h / 2}
        fill={fill} stroke={stroke} strokeWidth={sw} />
    )
  }

  if (shape === 'diamond') {
    const cx = x + w / 2, cy = y + h / 2
    return (
      <polygon
        points={`${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`}
        fill={fill} stroke={stroke} strokeWidth={sw} />
    )
  }

  if (shape === 'hexagon') {
    const cx = x + w / 2
    const pts = [
      `${cx},${y}`,
      `${x + w},${y + h * 0.25}`,
      `${x + w},${y + h * 0.75}`,
      `${cx},${y + h}`,
      `${x},${y + h * 0.75}`,
      `${x},${y + h * 0.25}`,
    ].join(' ')
    return (
      <polygon points={pts}
        fill={fill} stroke={stroke} strokeWidth={sw} />
    )
  }

  // rectangle + cylinder — rounded rect
  return (
    <rect x={x} y={y} width={w} height={h}
      rx={Math.min(4, h * 0.18)}
      fill={fill} stroke={stroke} strokeWidth={sw} />
  )
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export function StarterTemplatesModal({ open, onClose, onImport }) {
  function handleImport(template) {
    onImport(template)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:!max-w-4xl">
        <DialogHeader>
          <DialogTitle>Starter Templates</DialogTitle>
          <DialogDescription>
            Pick a template to instantly populate the canvas. This will replace
            any existing content.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-3" style={{ maxHeight: '60vh' }}>
          {CANVAS_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-surface-border bg-elevated self-start"
            >
              {/* SVG diagram preview */}
              <div className="aspect-video w-full overflow-hidden bg-base">
                <TemplatePreview nodes={tpl.nodes} edges={tpl.edges} />
              </div>

              {/* Text + action */}
              <div className="flex flex-col gap-2 p-3">
                <p className="text-sm font-semibold text-copy-primary">{tpl.name}</p>
                <p className="text-xs leading-relaxed text-copy-muted">
                  {tpl.description}
                </p>
                <Button
                  size="sm"
                  className="mt-1 w-full text-white"
                  onClick={() => handleImport(tpl)}
                >
                  Import Template
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
