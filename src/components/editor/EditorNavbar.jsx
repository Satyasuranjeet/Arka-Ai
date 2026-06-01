import { PanelLeftOpen, PanelLeftClose, Share2, BrainCircuit, LayoutTemplate, Loader2, CheckCircle2, AlertCircle, Save } from 'lucide-react'
import { UserButton } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'

/**
 * @param {{
 *   sidebarOpen: boolean,
 *   onToggleSidebar: () => void,
 *   projectName?: string,
 *   aiSidebarOpen?: boolean,
 *   onToggleAiSidebar?: () => void,
 *   saveStatus?: 'idle' | 'saving' | 'saved' | 'error',
 *   onShare?: () => void,
 *   onOpenTemplates?: () => void,
 *   onManualSave?: () => void,
 * }} props
 */
export function EditorNavbar({
  sidebarOpen,
  onToggleSidebar,
  projectName,
  aiSidebarOpen,
  onToggleAiSidebar,
  saveStatus = 'idle',
  onShare,
  onOpenTemplates,
  onManualSave,
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex h-12 items-center bg-surface border-b border-surface-border px-3 gap-3">
      {/* Left — sidebar toggle + project name */}
      <div className="flex items-center gap-2 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
        </Button>
        {projectName && (
          <div className="flex min-w-0 flex-col">
            <span className="truncate max-w-48 text-sm font-semibold leading-tight text-copy-primary">
              {projectName}
            </span>
            <span className="text-[10px] leading-none text-copy-muted">Workspace</span>
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right — workspace actions + user */}
      <div className="flex items-center gap-1">
        {projectName && (
          <>
            {/* Save status indicator */}
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-[11px] text-copy-muted">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving…
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-[11px] text-success">
                <CheckCircle2 className="h-3 w-3" />
                Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-1 text-[11px] text-error">
                <AlertCircle className="h-3 w-3" />
                Save failed
              </span>
            )}

            {/* Manual save button */}
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-copy-secondary"
              onClick={onManualSave}
              disabled={saveStatus === 'saving'}
              aria-label="Save"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-copy-secondary"
              onClick={onOpenTemplates}
            >
              <LayoutTemplate className="h-3.5 w-3.5" />
              Templates
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-copy-secondary"
              onClick={onShare}
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleAiSidebar}
              aria-label={aiSidebarOpen ? 'Close AI sidebar' : 'Open AI sidebar'}
              className={aiSidebarOpen ? 'text-accent-ai' : 'text-copy-secondary'}
            >
              <BrainCircuit className="h-4 w-4" />
            </Button>
          </>
        )}
        <UserButton />
      </div>
    </header>
  )
}
