import { useState } from 'react'
import { X, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

/**
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   projects: Array<{id: string, name: string, slug: string, owned: boolean}>,
 *   onNewProject: () => void,
 *   onRenameProject: (project: object) => void,
 *   onDeleteProject: (project: object) => void,
 * }} props
 */
export function ProjectSidebar({
  isOpen,
  onClose,
  projects = [],
  onNewProject,
  onRenameProject,
  onDeleteProject,
}) {
  const myProjects = projects.filter((p) => p.owned)
  const sharedProjects = projects.filter((p) => !p.owned)

  return (
    <>
      {/* Mobile backdrop scrim — tapping closes the sidebar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          'fixed top-12 left-0 bottom-0 z-30 w-72 flex flex-col bg-surface border-r border-surface-border transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex h-12 items-center justify-between px-4 border-b border-surface-border">
          <span className="text-sm font-medium text-copy-primary">Projects</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex-1 overflow-hidden flex flex-col p-3">
          <Tabs defaultValue="my-projects" className="flex-1 flex flex-col">
            <TabsList className="w-full">
              <TabsTrigger value="my-projects" className="flex-1">
                My Projects
              </TabsTrigger>
              <TabsTrigger value="shared" className="flex-1">
                Shared
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-projects" className="flex-1 overflow-y-auto">
              {myProjects.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-xs text-copy-muted">No projects yet.</p>
                </div>
              ) : (
                <ul className="mt-2 flex flex-col gap-1">
                  {myProjects.map((project) => (
                    <ProjectItem
                      key={project.id}
                      project={project}
                      showActions
                      onRename={() => onRenameProject(project)}
                      onDelete={() => onDeleteProject(project)}
                    />
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="shared" className="flex-1 overflow-y-auto">
              {sharedProjects.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-xs text-copy-muted">No shared projects.</p>
                </div>
              ) : (
                <ul className="mt-2 flex flex-col gap-1">
                  {sharedProjects.map((project) => (
                    <ProjectItem
                      key={project.id}
                      project={project}
                      showActions={false}
                    />
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-surface-border">
          <Button variant="outline" className="w-full gap-2" onClick={onNewProject}>
            <Plus />
            New Project
          </Button>
        </div>
      </div>
    </>
  )
}

/**
 * A single project row with an optional actions menu (rename / delete).
 *
 * @param {{
 *   project: {id: string, name: string},
 *   showActions: boolean,
 *   onRename?: () => void,
 *   onDelete?: () => void,
 * }} props
 */
function ProjectItem({ project, showActions = true, onRename, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <li className="group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-elevated cursor-pointer">
      <span className="flex-1 truncate text-copy-primary">{project.name}</span>

      {showActions && (
        <div className="relative">
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn(
              'opacity-0 transition-opacity group-hover:opacity-100',
              menuOpen && 'opacity-100'
            )}
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((prev) => !prev)
            }}
            aria-label="Project actions"
          >
            <MoreHorizontal />
          </Button>

          {menuOpen && (
            <>
              {/* Dismiss layer */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />
              {/* Dropdown */}
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[130px] rounded-xl border border-surface-border bg-elevated py-1 shadow-lg">
                <button
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-copy-primary hover:bg-subtle"
                  onClick={() => {
                    setMenuOpen(false)
                    onRename?.()
                  }}
                >
                  <Pencil className="size-3.5" />
                  Rename
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-subtle"
                  onClick={() => {
                    setMenuOpen(false)
                    onDelete?.()
                  }}
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </li>
  )
}
