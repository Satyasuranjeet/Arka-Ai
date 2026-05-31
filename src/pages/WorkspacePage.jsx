import { useState } from 'react'
import { Plus } from 'lucide-react'
import { EditorNavbar } from '../components/editor/EditorNavbar'
import { ProjectSidebar } from '../components/editor/ProjectSidebar'
import { ProjectDialogs } from '../components/editor/ProjectDialogs'
import { Button } from '../components/ui/button'
import { useProjectActions } from '../hooks/useProjectActions'

export function WorkspacePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const actions = useProjectActions()

  if (actions.isLoadingProjects) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base">
      <EditorNavbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />
      <ProjectSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        projects={actions.projects}
        onNewProject={actions.openCreate}
        onRenameProject={actions.openRename}
        onDeleteProject={actions.openDelete}
      />
      <ProjectDialogs dialogs={actions} />
      <main className="flex min-h-screen items-center justify-center pt-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-xl font-semibold text-foreground">
            Create a project or open an existing one
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Start a new architecture workspace, or choose a project from the sidebar.
          </p>
          <Button className="mt-2 gap-2" onClick={actions.openCreate}>
            <Plus />
            New Project
          </Button>
        </div>
      </main>
    </div>
  )
}
