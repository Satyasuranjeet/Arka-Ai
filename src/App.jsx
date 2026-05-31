import { useState } from 'react'
import { EditorNavbar } from './components/editor/EditorNavbar'
import { ProjectSidebar } from './components/editor/ProjectSidebar'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-base">
      <EditorNavbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />
      <ProjectSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="pt-12">
        {/* Editor canvas goes here */}
      </main>
    </div>
  )
}

export default App
