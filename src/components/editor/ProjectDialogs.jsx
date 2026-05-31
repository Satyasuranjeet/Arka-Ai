import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * Renders the Create, Rename, and Delete project dialogs.
 * Controlled by the object returned from useProjectDialogs.
 *
 * @param {{ dialogs: ReturnType<import('@/hooks/useProjectDialogs').useProjectDialogs> }} props
 */
export function ProjectDialogs({ dialogs }) {
  const {
    dialog,
    activeProject,
    formName,
    setFormName,
    slug,
    isLoading,
    closeDialog,
    handleCreate,
    handleRename,
    handleDelete,
  } = dialogs

  return (
    <>
      {/* ── Create Project ─────────────────────────────────── */}
      <Dialog open={dialog === 'create'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create project</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground">
                Project name
              </label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="My Architecture"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            {formName.trim() && (
              <p className="text-xs text-foreground/60">
                Room ID:{' '}
                <span className="font-mono text-foreground/80">{slug}</span>
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formName.trim() || isLoading}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Rename Project ─────────────────────────────────── */}
      <Dialog open={dialog === 'rename'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
            {activeProject && (
              <p className="text-xs text-foreground/60">
                Currently named{' '}
                <span className="font-medium text-foreground">
                  {activeProject.name}
                </span>
              </p>
            )}
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">
              New name
            </label>
            <Input
              autoFocus
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={!formName.trim() || isLoading}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Project ─────────────────────────────────── */}
      <Dialog open={dialog === 'delete'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete project</DialogTitle>
            {activeProject && (
              <p className="text-xs text-foreground/60">
                <span className="font-medium text-foreground">
                  {activeProject.name}
                </span>{' '}
                will be permanently deleted. This cannot be undone.
              </p>
            )}
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
