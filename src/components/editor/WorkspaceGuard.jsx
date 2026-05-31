import { useState, useEffect, useMemo } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { Compass, Sparkles, Bot } from 'lucide-react'
import { createApiClient } from '@/lib/api'
import { AccessDenied } from './AccessDenied'
import { EditorNavbar } from './EditorNavbar'
import { ProjectSidebar } from './ProjectSidebar'
import { ProjectDialogs } from './ProjectDialogs'
import { ShareDialog } from './ShareDialog'
import { useProjectActions } from '@/hooks/useProjectActions'

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
        onShare={() => setShareOpen(true)}
      />

      {/* Body row */}
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

        {/* Central canvas */}
        <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-base">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[480px] w-[480px] rounded-full bg-brand/5 blur-[100px]" />
          </div>

          {/* Placeholder content */}
          <div className="relative flex flex-col items-center gap-5 px-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-brand/20 bg-brand/10">
              <Compass className="h-7 w-7 text-brand" />
            </div>
            <p className="text-[10px] font-semibold tracking-[0.25em] text-copy-muted uppercase">
              Workspace Shell
            </p>
            <h2 className="max-w-lg text-4xl font-bold leading-tight text-copy-primary">
              Canvas and collaboration tooling land here next.
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-copy-muted">
              This room is ready for the shared architecture canvas, durable AI
              workflows, and real-time presence. For now, the shell is wired with
              project context and navigation only.
            </p>
          </div>
        </main>

        {/* Right AI sidebar */}
        {aiSidebarOpen && (
          <aside className="flex w-72 flex-shrink-0 flex-col border-l border-surface-border bg-surface">
            {/* Header */}
            <div className="flex flex-shrink-0 items-start justify-between border-b border-surface-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-copy-primary">AI Copilot</p>
                <p className="text-[11px] text-copy-muted">Placeholder panel</p>
              </div>
              <Sparkles className="mt-0.5 h-4 w-4 text-[#8b82ff]" />
            </div>

            {/* Cards */}
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
              <div className="rounded-2xl border border-surface-border bg-elevated p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(100,87,249,0.15)]">
                    <Bot className="h-4 w-4 text-[#8b82ff]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-copy-primary">
                      Chat surface pending
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-copy-muted">
                      The toggle is wired. Messaging and generation are
                      intentionally out of scope here.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-surface-border bg-elevated p-4">
                <p className="mb-2 text-[10px] font-semibold tracking-[0.18em] text-copy-faint uppercase">
                  Future Hooks
                </p>
                <p className="text-[11px] leading-relaxed text-copy-muted">
                  Prompt composer, run status, and architecture guidance will
                  attach to this sidebar.
                </p>
              </div>
            </div>
          </aside>
        )}
      </div>

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
