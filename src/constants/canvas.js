/**
 * Canvas constants — node colors, shapes, and type designators.
 *
 * All color pairs come from the NODE_COLORS table in context/ui-context.md.
 * Each pair defines a dark fill and a vivid contrasting text color.
 */

// ---------------------------------------------------------------------------
// Node color palette
// ---------------------------------------------------------------------------

export const NODE_COLORS = [
  { fill: '#1F1F1F', text: '#EDEDED', label: 'Default' },
  { fill: '#10233D', text: '#52A8FF', label: 'Blue' },
  { fill: '#2E1938', text: '#BF7AF0', label: 'Purple' },
  { fill: '#331B00', text: '#FF990A', label: 'Orange' },
  { fill: '#3C1618', text: '#FF6166', label: 'Red' },
  { fill: '#3A1726', text: '#F75F8F', label: 'Pink' },
  { fill: '#0F2E18', text: '#62C073', label: 'Green' },
  { fill: '#062822', text: '#0AC7B4', label: 'Teal' },
]

export const DEFAULT_NODE_COLOR = NODE_COLORS[0]

// ---------------------------------------------------------------------------
// Node shapes
// ---------------------------------------------------------------------------

export const NODE_SHAPES = [
  'rectangle',
  'diamond',
  'circle',
  'pill',
  'cylinder',
  'hexagon',
]

// ---------------------------------------------------------------------------
// Default node data model
// ---------------------------------------------------------------------------

/** @type {{ label: string, color: (typeof NODE_COLORS)[0], shape: string }} */
export const DEFAULT_NODE_DATA = {
  label: 'Node',
  color: DEFAULT_NODE_COLOR,
  shape: 'rectangle',
}

// ---------------------------------------------------------------------------
// Custom type designators
// Used as React Flow nodeTypes / edgeTypes keys when registering
// custom renderers in a future spec.
// ---------------------------------------------------------------------------

/** Custom node type identifier. */
export const canvasNode = 'canvasNode'

/** Custom edge type identifier. */
export const canvasEdge = 'canvasEdge'
