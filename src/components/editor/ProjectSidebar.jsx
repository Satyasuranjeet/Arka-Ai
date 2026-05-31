import { X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export function ProjectSidebar({ isOpen, onClose }) {
  return (
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

          <TabsContent
            value="my-projects"
            className="flex-1 flex items-center justify-center"
          >
            <p className="text-xs text-copy-muted">No projects yet.</p>
          </TabsContent>

          <TabsContent
            value="shared"
            className="flex-1 flex items-center justify-center"
          >
            <p className="text-xs text-copy-muted">No shared projects.</p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-surface-border">
        <Button variant="outline" className="w-full gap-2">
          <Plus />
          New Project
        </Button>
      </div>
    </div>
  )
}
