/**
 * CanvasWrapper — sets up the Liveblocks room and renders the React Flow canvas.
 *
 * Wraps:
 *   RoomProvider  → Liveblocks room for the current project (auth via backend).
 *   ClientSideSuspense → defers canvas render until Liveblocks storage is ready.
 *   CanvasErrorBoundary → catches socket/connection errors with a graceful fallback.
 *   LiveCanvas     → the actual React Flow canvas wired to Liveblocks storage.
 */

import { Component, useRef, createContext, useContext } from 'react'
import { RoomProvider, ClientSideSuspense, useUndo, useRedo, useCanUndo, useCanRedo, useUpdateMyPresence } from '@liveblocks/react'
import { useLiveblocksFlow } from '@liveblocks/react-flow'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { INITIAL_PRESENCE } from '@/liveblocks.config'
import { DEFAULT_NODE_COLOR, canvasNode, canvasEdge } from '@/constants/canvas'
import { CanvasNode } from './nodes/CanvasNode'
import { CanvasEdge } from './edges/CanvasEdge'
import { ShapePanel } from './ShapePanel'
import { ControlBar } from './ControlBar'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { StarterTemplatesModal } from './StarterTemplatesModal'
import { PresenceBar } from './PresenceBar'
import { LiveCursors } from './LiveCursors'

// Context to thread templates modal state through Liveblocks' ClientSideSuspense
const TemplatesContext = createContext({ templatesOpen: false, onCloseTemplates: () => {} })

// Register custom node and edge types — defined outside the component to keep
// references stable and prevent React Flow from re-mounting on each render.
const nodeTypes = { [canvasNode]: CanvasNode }
const edgeTypes = { [canvasEdge]: CanvasEdge }

// ---------------------------------------------------------------------------
// Live canvas — rendered inside ClientSideSuspense so storage is guaranteed ready
// ---------------------------------------------------------------------------

const defaultEdgeOptions = {
  type: canvasEdge,
}

function LiveCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
  } = useLiveblocksFlow({ suspense: true })

  // React Flow instance — stored in a ref so drop handler can call screenToFlowPosition
  const rfInstance = useRef(null)
  // Monotonic counter appended to node IDs to prevent collisions within a session
  const nodeCounter = useRef(0)

  // Liveblocks room history
  const undo    = useUndo()
  const redo    = useRedo()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()

  // Global keyboard shortcuts for zoom and history
  useKeyboardShortcuts(rfInstance, undo, redo)

  // Presence — broadcast cursor position to other collaborators
  const updateMyPresence = useUpdateMyPresence()

  function handleMouseMove(e) {
    if (!rfInstance.current) return
    const pos = rfInstance.current.screenToFlowPosition({ x: e.clientX, y: e.clientY })
    updateMyPresence({ cursor: pos })
  }

  function handleMouseLeave() {
    updateMyPresence({ cursor: null })
  }

  // Templates modal state from context (threaded through ClientSideSuspense)
  const { templatesOpen, onCloseTemplates } = useContext(TemplatesContext)

  // Replace the entire canvas with a starter template
  function handleImportTemplate(template) {
    const removeNodes = nodes.map((n) => ({ type: 'remove', id: n.id }))
    const removeEdges = edges.map((e) => ({ type: 'remove', id: e.id }))
    const addNodes    = template.nodes.map((n) => ({ type: 'add', item: n }))
    const addEdges    = template.edges.map((e) => ({ type: 'add', item: e }))
    onNodesChange([...removeNodes, ...addNodes])
    onEdgesChange([...removeEdges, ...addEdges])
    setTimeout(() => rfInstance.current?.fitView({ duration: 400, padding: 0.15 }), 120)
  }

  function handleDragOver(event) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  function handleDrop(event) {
    event.preventDefault()
    const raw = event.dataTransfer.getData('application/reactflow')
    if (!raw || !rfInstance.current) return

    let payload
    try {
      payload = JSON.parse(raw)
    } catch {
      return
    }

    const { shape, width, height } = payload

    // Convert screen coords → canvas (flow) coords, then center the node on the cursor
    const center = rfInstance.current.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    })
    const position = { x: center.x - width / 2, y: center.y - height / 2 }

    const id = `${shape}-${Date.now()}-${nodeCounter.current++}`
    const newNode = {
      id,
      type: canvasNode,
      position,
      style: { width, height },
      data: {
        label: '',
        color: DEFAULT_NODE_COLOR,
        shape,
      },
    }

    onNodesChange([{ type: 'add', item: newNode }])
  }

  return (
    <div
      className="relative h-full w-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDelete={onDelete}
          onInit={(instance) => { rfInstance.current = instance }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          connectOnClick={false}
          deleteKeyCode={['Backspace', 'Delete']}
          proOptions={{ hideAttribution: true }}
        >
          {/* Dot-pattern background */}
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#2a2a30"
          />
        </ReactFlow>

        {/* Live cursors sit above ReactFlow so they are not clipped or transformed */}
        <LiveCursors />
      </ReactFlowProvider>

      {/* Shape panel floats above the canvas, outside the ReactFlow viewport */}
      <ShapePanel />

      {/* Presence avatar bar — top-right corner, shows collaborators + self */}
      <PresenceBar />

      {/* Control bar — zoom and undo/redo, bottom-left above the shape panel */}
      <ControlBar
        rfInstance={rfInstance}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Starter templates modal — state provided via TemplatesContext */}
      <StarterTemplatesModal
        open={templatesOpen}
        onClose={onCloseTemplates}
        onImport={handleImportTemplate}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Loading state shown while Liveblocks storage hydrates
// ---------------------------------------------------------------------------

function CanvasLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-base">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Error fallback for Liveblocks socket / connection failures
// ---------------------------------------------------------------------------

function CanvasErrorFallback() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-base">
      <p className="text-sm font-semibold text-copy-primary">Connection error</p>
      <p className="max-w-xs text-center text-xs leading-relaxed text-copy-muted">
        Could not connect to the collaboration server. Check your network and
        try refreshing the page.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-1 rounded-xl border border-surface-border bg-elevated px-4 py-2 text-xs font-semibold text-copy-primary hover:bg-subtle"
      >
        Refresh
      </button>
    </div>
  )
}

class CanvasErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) return <CanvasErrorFallback />
    return this.props.children
  }
}

// ---------------------------------------------------------------------------
// Public wrapper — receives projectId and mounts the full Liveblocks room
// ---------------------------------------------------------------------------

export function CanvasWrapper({ projectId, templatesOpen = false, onCloseTemplates = () => {} }) {
  return (
    <CanvasErrorBoundary>
      <TemplatesContext.Provider value={{ templatesOpen, onCloseTemplates }}>
        <RoomProvider
          id={`project-${projectId}`}
          initialPresence={INITIAL_PRESENCE}
        >
          <ClientSideSuspense fallback={<CanvasLoading />}>
            <LiveCanvas />
          </ClientSideSuspense>
        </RoomProvider>
      </TemplatesContext.Provider>
    </CanvasErrorBoundary>
  )
}
