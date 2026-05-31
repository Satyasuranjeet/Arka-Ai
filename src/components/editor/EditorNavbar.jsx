import { PanelLeftOpen, PanelLeftClose } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EditorNavbar({ sidebarOpen, onToggleSidebar }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex h-12 items-center bg-surface border-b border-surface-border px-3">
      {/* Left */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
        </Button>
      </div>

      {/* Center */}
      <div className="flex-1" />

      {/* Right */}
      <div className="flex items-center" />
    </header>
  )
}
