import { useState } from 'react'

/** @type {Array<{id: string, name: string, slug: string, owned: boolean}>} */
const MOCK_PROJECTS = [
  { id: '1', name: 'E-Commerce Platform', slug: 'e-commerce-platform', owned: true },
  { id: '2', name: 'Mobile Banking App', slug: 'mobile-banking-app', owned: true },
  { id: '3', name: 'Shared Architecture', slug: 'shared-architecture', owned: false },
]

/**
 * Converts a display name into a URL-safe slug.
 * @param {string} name
 * @returns {string}
 */
function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Manages dialog state, form state, and mock project list for
 * Create / Rename / Delete project dialogs.
 */
export function useProjectDialogs() {
  const [projects, setProjects] = useState(MOCK_PROJECTS)
  /** @type {['create'|'rename'|'delete'|null, Function]} */
  const [dialog, setDialog] = useState(null)
  const [activeProject, setActiveProject] = useState(null)
  const [formName, setFormName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function openCreate() {
    setFormName('')
    setDialog('create')
  }

  function openRename(project) {
    setActiveProject(project)
    setFormName(project.name)
    setDialog('rename')
  }

  function openDelete(project) {
    setActiveProject(project)
    setDialog('delete')
  }

  function closeDialog() {
    setDialog(null)
    setActiveProject(null)
    setFormName('')
  }

  function handleCreate() {
    if (!formName.trim()) return
    setIsLoading(true)
    const newProject = {
      id: String(Date.now()),
      name: formName.trim(),
      slug: toSlug(formName),
      owned: true,
    }
    setProjects((prev) => [...prev, newProject])
    setIsLoading(false)
    closeDialog()
  }

  function handleRename() {
    if (!formName.trim() || !activeProject) return
    setIsLoading(true)
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProject.id
          ? { ...p, name: formName.trim(), slug: toSlug(formName) }
          : p
      )
    )
    setIsLoading(false)
    closeDialog()
  }

  function handleDelete() {
    if (!activeProject) return
    setIsLoading(true)
    setProjects((prev) => prev.filter((p) => p.id !== activeProject.id))
    setIsLoading(false)
    closeDialog()
  }

  return {
    projects,
    dialog,
    activeProject,
    formName,
    setFormName,
    isLoading,
    slug: toSlug(formName),
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    handleCreate,
    handleRename,
    handleDelete,
  }
}
