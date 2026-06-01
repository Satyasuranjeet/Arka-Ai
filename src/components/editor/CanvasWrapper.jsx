/**
 * CanvasWrapper — sets up the Liveblocks room and renders the React Flow canvas.
 *
 * Wraps:
 *   RoomProvider  → Liveblocks room for the current project (auth via backend).
 *   ClientSideSuspense → defers canvas render until Liveblocks storage is ready.
 *   CanvasErrorBoundary → catches socket/connection errors with a graceful fallback.
 *   LiveCanvas     → the actual React Flow canvas wired to Liveblocks storage.
 */

import { Component, useState, useRef, useEffect, createContext, useContext, useMemo } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useUndo, useRedo, useCanUndo, useCanRedo, useUpdateMyPresence } from '@liveblocks/react'
import { useLiveblocksFlow } from '@liveblocks/react-flow'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { DEFAULT_NODE_COLOR, canvasNode, canvasEdge } from '@/constants/canvas'
import { CanvasNode } from './nodes/CanvasNode'
import { CanvasEdge } from './edges/CanvasEdge'
import { ShapePanel } from './ShapePanel'
import { ControlBar } from './ControlBar'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useAutosave } from '@/hooks/useAutosave'
import { createApiClient } from '@/lib/api'
import { StarterTemplatesModal } from './StarterTemplatesModal'
import { PresenceBar } from './PresenceBar'
import { LiveCursors } from './LiveCursors'

// Context to thread modal/save state through Liveblocks' ClientSideSuspense
const TemplatesContext = createContext({
  templatesOpen: false,
  onCloseTemplates: () => {},
  projectId: null,
  onSaveStatusChange: () => {},
  onSaveTriggerReady: () => {},
})

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

const EMPTY_FLOW_ITEMS = []

function LiveCanvas() {
  // useLiveblocksFlow without suspense: true never throws a Promise, so
  // ClientSideSuspense (and the ReactFlowProvider it wraps) never unmounts.
  const {
    nodes: liveNodes,
    edges: liveEdges,
    isLoading: isFlowLoading,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
  } = useLiveblocksFlow({
    nodes: { initial: [] },
    edges: { initial: [] },
  })
  const isFlowReady = !isFlowLoading && Array.isArray(liveNodes) && Array.isArray(liveEdges)
  const nodes = Array.isArray(liveNodes) ? liveNodes : EMPTY_FLOW_ITEMS
  const edges = Array.isArray(liveEdges) ? liveEdges : EMPTY_FLOW_ITEMS
  const [stableFlow, setStableFlow] = useState({ nodes: [], edges: [] })
  const [hasRenderedFlow, setHasRenderedFlow] = useState(false)
  const visibleNodes = isFlowReady ? nodes : stableFlow.nodes
  const visibleEdges = isFlowReady ? edges : stableFlow.edges

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

  // Selection mode — when true, left-drag on empty canvas draws a selection box;
  // panning requires middle or right mouse button instead of left.
  const [selectMode, setSelectMode] = useState(false)

  // Presence — broadcast cursor position to other collaborators
  const updateMyPresence = useUpdateMyPresence()
  // Canvas context — projectId and save-status callback from CanvasWrapper
  const { templatesOpen, onCloseTemplates, projectId, onSaveStatusChange, onSaveTriggerReady } = useContext(TemplatesContext)

  // Manual save — only fires when triggerSave() is explicitly called
  const { saveStatus, triggerSave } = useAutosave({ nodes: visibleNodes, edges: visibleEdges, projectId })
  useEffect(() => { onSaveStatusChange(saveStatus) }, [saveStatus, onSaveStatusChange])
  // Register the manual-save trigger with the parent so EditorNavbar can call it
  useEffect(() => { onSaveTriggerReady(triggerSave) }, [triggerSave, onSaveTriggerReady])

  // Canvas load — on first mount, if the room is empty, hydrate from the saved blob
  const { getToken } = useAuth()
  const hasLoadedRef = useRef(false)
  useEffect(() => {
    if (hasLoadedRef.current || !projectId || !isFlowReady) return
    hasLoadedRef.current = true
    // If the room already has live data from a collaborator, skip the backend load.
    if (nodes.length > 0 || edges.length > 0) return
    ;(async () => {
      try {
        const { apiFetch } = createApiClient(getToken)
        const data = await apiFetch(`/api/projects/${projectId}/canvas`)
        const savedNodes = Array.isArray(data.nodes) ? data.nodes : []
        const savedEdges = Array.isArray(data.edges) ? data.edges : []
        if (savedNodes.length > 0 || savedEdges.length > 0) {
          onNodesChange(savedNodes.map((n) => ({ type: 'add', item: n })))
          onEdgesChange(savedEdges.map((e) => ({ type: 'add', item: e })))
          setTimeout(() => rfInstance.current?.fitView({ duration: 400, padding: 0.15 }), 120)
        }
      } catch {
        // Silently ignore load failures — canvas stays empty
      }
    })()
  }, [projectId, isFlowReady, nodes.length, edges.length, getToken, onNodesChange, onEdgesChange])

  useEffect(() => {
    if (!isFlowReady || hasRenderedFlow) return
    const id = setTimeout(() => {
      setHasRenderedFlow(true)
    }, 0)
    return () => clearTimeout(id)
  }, [isFlowReady, hasRenderedFlow])

  useEffect(() => {
    if (!isFlowReady) return
    const id = setTimeout(() => {
      setStableFlow({ nodes, edges })
    }, 0)
    return () => clearTimeout(id)
  }, [isFlowReady, nodes, edges])

  function handleMouseMove(e) {
    if (!rfInstance.current) return
    const pos = rfInstance.current.screenToFlowPosition({ x: e.clientX, y: e.clientY })
    updateMyPresence({ cursor: pos })
  }

  function handleMouseLeave() {
    updateMyPresence({ cursor: null })
  }

  // Replace the entire canvas with a starter template
  function handleImportTemplate(template) {
    const removeNodes = visibleNodes.map((n) => ({ type: 'remove', id: n.id }))
    const removeEdges = visibleEdges.map((e) => ({ type: 'remove', id: e.id }))
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

  // Show the spinner only for the initial Liveblocks storage setup.
  // After first render, keep React Flow mounted through AI join/leave sync blips.
  if (!hasRenderedFlow && !isFlowReady) {
    return <CanvasLoading />
  }

  return (
    <div
      className="relative h-full w-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <ReactFlowProvider>
        <ReactFlow
          nodes={visibleNodes}
          edges={visibleEdges}
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
          connectOnClick={false}
          deleteKeyCode={['Backspace', 'Delete']}
          selectionOnDrag={selectMode}
          panOnDrag={selectMode ? [1, 2] : true}
          multiSelectionKeyCode={['Meta', 'Shift']}
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
        selectMode={selectMode}
        onToggleSelectMode={() => setSelectMode((v) => !v)}
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

export function CanvasWrapper({
  projectId,
  templatesOpen = false,
  onCloseTemplates = () => {},
  onSaveStatusChange = () => {},
  onSaveTriggerReady = () => {},
}) {
  // Memoize context value so LiveCanvas only re-renders when these values
  // actually change, not on every WorkspaceGuard parent render.
  const contextValue = useMemo(
    () => ({ templatesOpen, onCloseTemplates, projectId, onSaveStatusChange, onSaveTriggerReady }),
    [templatesOpen, onCloseTemplates, projectId, onSaveStatusChange, onSaveTriggerReady],
  )
  return (
    <CanvasErrorBoundary>
      <TemplatesContext.Provider value={contextValue}>
        <LiveCanvas />
      </TemplatesContext.Provider>
    </CanvasErrorBoundary>
  )
}
