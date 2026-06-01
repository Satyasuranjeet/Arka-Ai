import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { RoomProvider } from '@liveblocks/react'
import { createApiClient } from '@/lib/api'
import { INITIAL_PRESENCE } from '@/liveblocks.config'
import { AccessDenied } from './AccessDenied'
import { EditorNavbar } from './EditorNavbar'
import { ProjectSidebar } from './ProjectSidebar'
import { ProjectDialogs } from './ProjectDialogs'
import { ShareDialog } from './ShareDialog'
import { useProjectActions } from '@/hooks/useProjectActions'
import { CanvasWrapper } from './CanvasWrapper'
import { AiSidebar } from './AiSidebar'

/**
 * Route-level guard for `/editor/:projectId`.
 *
 * 1. Waits for Clerk to finish loading.
 * 2. If unauthenticated → redirect to /sign-in.
 * 3. Calls GET /api/projects/verify-access/:projectId to confirm the user
 *    has owner or collaborator access.
 * 4. On denial → renders <AccessDenied />.
 * 5. On success → renders the full workspace shell with project data.
 */
export function WorkspaceGuard() {
  const { projectId } = useParams()
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const { apiFetch } = useMemo(() => createApiClient(getToken), [getToken])

  // ── Access verification state ───────────────────────────────────────────
  const [verifyStatus, setVerifyStatus] = useState('loading')
  // 'loading' | 'ok' | 'denied' | 'unauthenticated'
  const [project, setProject] = useState(null)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      setVerifyStatus('unauthenticated')
      return
    }
    verifyAccess()
  }, [isLoaded, isSignedIn, projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function verifyAccess() {
    setVerifyStatus('loading')
    try {
      const data = await apiFetch(`/api/projects/verify-access/${projectId}`)
      setProject(data)
      setVerifyStatus('ok')
    } catch {
      setVerifyStatus('denied')
    }
  }

  // ── Layout state (only used after verification succeeds) ────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState('idle')
  const saveTriggerRef = useRef(null)
  const handleSaveTriggerReady = useCallback((fn) => { saveTriggerRef.current = fn }, [])
  const handleCloseTemplates = useCallback(() => setTemplatesOpen(false), [])
  const actions = useProjectActions()

  // ── Render gates ────────────────────────────────────────────────────────
  if (!isLoaded || verifyStatus === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    )
  }

  if (verifyStatus === 'unauthenticated') {
    return <Navigate to="/sign-in" replace />
  }

  if (verifyStatus === 'denied') {
    return <AccessDenied />
  }

  // ── Workspace shell ─────────────────────────────────────────────────────
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-base">
      {/* Top Navbar */}
      <EditorNavbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        projectName={project.name}
        aiSidebarOpen={aiSidebarOpen}
        onToggleAiSidebar={() => setAiSidebarOpen((prev) => !prev)}
        saveStatus={saveStatus}
        onShare={() => setShareOpen(true)}
        onOpenTemplates={() => setTemplatesOpen(true)}
        onManualSave={() => saveTriggerRef.current?.()}
      />

      {/* Body row */}
      <RoomProvider
        id={`project-${projectId}`}
        initialPresence={INITIAL_PRESENCE}
      >
      <div className="flex flex-1 overflow-hidden pt-12">

        {/* Left sidebar */}
        <ProjectSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          projects={actions.projects}
          activeProjectId={projectId}
          onNewProject={actions.openCreate}
          onRenameProject={actions.openRename}
          onDeleteProject={actions.openDelete}
        />

        {/* Central canvas — CanvasWrapper owns the RoomProvider + React Flow */}
        <main className="relative flex-1 overflow-hidden bg-base">
          <CanvasWrapper
            projectId={projectId}
            templatesOpen={templatesOpen}
            onCloseTemplates={handleCloseTemplates}
            onSaveStatusChange={setSaveStatus}
            onSaveTriggerReady={handleSaveTriggerReady}
          />
        </main>

        {/* Right AI sidebar — floats over canvas */}
        {aiSidebarOpen && (
          <AiSidebar
            projectId={projectId}
            onClose={() => setAiSidebarOpen(false)}
          />
        )}
      </div>
      </RoomProvider>

      {/* Dialogs */}
      <ProjectDialogs dialogs={actions} />
      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        project={project}
      />
    </div>
  )
}
