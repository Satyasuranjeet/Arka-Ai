import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Copy, Check, X, UserPlus, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createApiClient } from '@/lib/api'

/**
 * Share dialog for a project.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   project: { id: string, name: string, owner_id: string } | null,
 * }} props
 */
export function ShareDialog({ open, onClose, project }) {
  const { getToken, userId } = useAuth()
  const { apiFetch } = useMemo(() => createApiClient(getToken), [getToken])
  const isOwner = !!project && project.owner_id === userId

  const [collaborators, setCollaborators] = useState([])
  const [isLoadingCollabs, setIsLoadingCollabs] = useState(false)

  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')

  const [copied, setCopied] = useState(false)

  // Load collaborators whenever the dialog opens (or project changes)
  useEffect(() => {
    if (!open || !project) {
      setCollaborators([])
      setInviteEmail('')
      setInviteError('')
      return
    }
    loadCollaborators()
  }, [open, project?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadCollaborators() {
    setIsLoadingCollabs(true)
    try {
      const data = await apiFetch(`/api/projects/${project.id}/collaborators`)
      setCollaborators(data)
    } catch (err) {
      console.error('Failed to load collaborators:', err)
    } finally {
      setIsLoadingCollabs(false)
    }
  }

  async function handleInvite(e) {
    e.preventDefault()
    const email = inviteEmail.trim()
    if (!email) return
    setInviteError('')
    setIsInviting(true)
    try {
      const collab = await apiFetch(`/api/projects/${project.id}/collaborators`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setCollaborators((prev) => [...prev, collab])
      setInviteEmail('')
    } catch (err) {
      setInviteError(err.message || 'Failed to send invite')
    } finally {
      setIsInviting(false)
    }
  }

  async function handleRemove(email) {
    try {
      await apiFetch(
        `/api/projects/${project.id}/collaborators/${encodeURIComponent(email)}`,
        { method: 'DELETE' },
      )
      setCollaborators((prev) => prev.filter((c) => c.email !== email))
    } catch (err) {
      console.error('Failed to remove collaborator:', err)
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function getInitials(name) {
    return (name || '?')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md border-surface-border bg-surface">
        <DialogHeader>
          <DialogTitle className="text-copy-primary">
            Share &ldquo;{project?.name}&rdquo;
          </DialogTitle>
          <DialogDescription className="text-copy-muted">
            {isOwner
              ? 'Invite people to collaborate on this project.'
              : 'People who have access to this project.'}
          </DialogDescription>
        </DialogHeader>

        {/* Invite form — owner only */}
        {isOwner && (
          <form onSubmit={handleInvite} className="flex gap-2">
            <Input
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1"
              autoComplete="off"
            />
            <Button
              type="submit"
              size="sm"
              disabled={isInviting || !inviteEmail.trim()}
              className="gap-1.5"
            >
              {isInviting
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <UserPlus className="h-3.5 w-3.5" />}
              Invite
            </Button>
          </form>
        )}

        {inviteError && (
          <p className="text-xs text-error">{inviteError}</p>
        )}

        {/* Collaborator list */}
        <div className="flex flex-col gap-1.5">
          {isLoadingCollabs ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-brand" />
            </div>
          ) : collaborators.length === 0 ? (
            <p className="py-3 text-center text-xs text-copy-muted">
              No collaborators yet.
            </p>
          ) : (
            collaborators.map((c) => (
              <div
                key={c.email}
                className="flex items-center gap-3 rounded-xl bg-elevated px-3 py-2"
              >
                {/* Avatar */}
                {c.avatar_url ? (
                  <img
                    src={c.avatar_url}
                    alt={c.display_name}
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-subtle text-xs font-semibold text-copy-secondary">
                    {getInitials(c.display_name)}
                  </div>
                )}

                {/* Name / email */}
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm text-copy-primary">
                    {c.display_name}
                  </span>
                  {c.display_name !== c.email && (
                    <span className="truncate text-xs text-copy-muted">
                      {c.email}
                    </span>
                  )}
                </div>

                {/* Remove button — owner only */}
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-copy-muted hover:text-destructive"
                    onClick={() => handleRemove(c.email)}
                    aria-label={`Remove ${c.display_name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Copy link */}
        <div className="flex items-center gap-2 overflow-hidden rounded-xl border border-surface-border bg-elevated px-3 py-2">
          <span className="flex-1 truncate text-xs text-copy-muted">
            {typeof window !== 'undefined' ? window.location.href : ''}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 gap-1.5 text-xs"
            onClick={handleCopyLink}
          >
            {copied
              ? <Check className="h-3.5 w-3.5 text-success" />
              : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy link'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
