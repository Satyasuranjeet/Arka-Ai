import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { createApiClient } from '@/lib/api'

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

/** Generates a short alphanumeric suffix. */
function generateSuffix() {
  return Date.now().toString(36).slice(-5)
}

/**
 * Manages project data fetching and all Create / Rename / Delete mutations
 * against the real backend API. Drop-in replacement for useProjectDialogs.
 */
export function useProjectActions() {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const navigate = useNavigate()
  const { projectId: activeProjectId } = useParams()

  const { apiFetch } = useMemo(() => createApiClient(getToken), [getToken])

  // ── Project list ────────────────────────────────────────────────────────
  const [projects, setProjects] = useState([])
  // Start in loading state; stays true until auth is confirmed + fetch resolves.
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)

  // Only fetch once Clerk has confirmed the session is ready.
  // Avoids 401s from stale/refreshing tokens on first mount.
  useEffect(() => {
    if (!isLoaded) return          // Clerk still initialising — keep spinner
    if (!isSignedIn) {
      setIsLoadingProjects(false)  // Not signed in — stop spinner
      return
    }
    loadProjects()
  }, [isLoaded, isSignedIn]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadProjects() {
    try {
      setIsLoadingProjects(true)
      const data = await apiFetch('/api/projects')
      // Backend only returns owned projects; mark them accordingly
      setProjects(data.map((p) => ({ ...p, owned: true })))
    } catch (e) {
      console.error('Failed to load projects:', e)
    } finally {
      setIsLoadingProjects(false)
    }
  }

  // ── Dialog state ─────────────────────────────────────────────────────────
  /** @type {['create'|'rename'|'delete'|null, Function]} */
  const [dialog, setDialog] = useState(null)
  const [activeProject, setActiveProject] = useState(null)
  const [formName, setFormName] = useState('')
  const [roomSuffix, setRoomSuffix] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Room ID preview shown in the create dialog (slug + stable suffix)
  const roomId = formName.trim()
    ? `${toSlug(formName.trim())}-${roomSuffix}`
    : ''

  // ── Open / close ─────────────────────────────────────────────────────────
  function openCreate() {
    setFormName('')
    setRoomSuffix(generateSuffix())
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

  // ── Mutations ─────────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!formName.trim()) return
    setIsLoading(true)
    try {
      const project = await apiFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: formName.trim() }),
      })
      closeDialog()
      navigate(`/editor/${project.id}`)
    } catch (e) {
      console.error('Failed to create project:', e)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRename() {
    if (!formName.trim() || !activeProject) return
    setIsLoading(true)
    try {
      const updated = await apiFetch(`/api/projects/${activeProject.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: formName.trim() }),
      })
      setProjects((prev) =>
        prev.map((p) =>
          p.id === updated.id ? { ...updated, owned: true } : p
        )
      )
      closeDialog()
    } catch (e) {
      console.error('Failed to rename project:', e)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    if (!activeProject) return
    setIsLoading(true)
    try {
      await apiFetch(`/api/projects/${activeProject.id}`, { method: 'DELETE' })
      setProjects((prev) => prev.filter((p) => p.id !== activeProject.id))
      closeDialog()
      // If the deleted project is the currently open workspace, go home
      if (activeProjectId === activeProject.id) {
        navigate('/editor')
      }
    } catch (e) {
      console.error('Failed to delete project:', e)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    projects,
    isLoadingProjects,
    dialog,
    activeProject,
    formName,
    setFormName,
    // Exposed as 'slug' so ProjectDialogs works without changes
    slug: roomId,
    isLoading,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    handleCreate,
    handleRename,
    handleDelete,
  }
}
