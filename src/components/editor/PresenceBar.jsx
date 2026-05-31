/**
 * PresenceBar — floating collaborator avatar stack + current-user button.
 *
 * Rendered as an absolute overlay in the top-right corner of the canvas
 * container. Only mounts inside an active Liveblocks room (LiveCanvas).
 *
 * Layout:
 *   [avatar] [avatar] … [+N]  │  <UserButton />
 *            (divider hidden when no collaborators)
 */

import { useOthers, useSelf } from '@liveblocks/react'
import { UserButton } from '@clerk/clerk-react'

// ---------------------------------------------------------------------------
// Single collaborator avatar — photo or initials fallback
// ---------------------------------------------------------------------------

function AvatarCircle({ name, avatar, color }) {
  const initials = name
    ? name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?'

  return (
    <div
      className="h-7 w-7 shrink-0 select-none overflow-hidden rounded-full border-2 border-base flex items-center justify-center"
      style={{ background: avatar ? 'transparent' : (color ?? '#3a3a42') }}
      title={name ?? 'Collaborator'}
    >
      {avatar ? (
        <img src={avatar} alt={name ?? 'avatar'} className="h-full w-full object-cover" draggable={false} />
      ) : (
        <span className="text-[10px] font-semibold leading-none text-white">{initials}</span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// PresenceBar
// ---------------------------------------------------------------------------

export function PresenceBar() {
  const self    = useSelf()
  const others  = useOthers()

  const currentUserId = self?.id

  // Exclude the current user's own connections (e.g. multiple open tabs)
  const collaborators = others.filter((u) => u.id !== currentUserId)

  const MAX_VISIBLE = 5
  const visible  = collaborators.slice(0, MAX_VISIBLE)
  const overflow = collaborators.length - MAX_VISIBLE

  return (
    <div
      className="absolute top-3 right-3 z-20 flex items-center pointer-events-none"
      // Entire bar is non-interactive except the UserButton wrapper below
    >
      {collaborators.length > 0 && (
        <>
          {/* Overlapping avatar stack */}
          <div className="flex items-center">
            {visible.map((user, i) => (
              <div
                key={user.connectionId}
                style={{ marginLeft: i === 0 ? 0 : -8, zIndex: MAX_VISIBLE - i }}
              >
                <AvatarCircle
                  name={user.info?.name}
                  avatar={user.info?.avatar}
                  color={user.info?.color}
                />
              </div>
            ))}

            {overflow > 0 && (
              <div
                className="flex h-7 min-w-[28px] items-center justify-center rounded-full border-2 border-base bg-subtle px-1.5"
                style={{ marginLeft: -8, zIndex: 0 }}
              >
                <span className="text-[10px] font-semibold text-copy-secondary">
                  +{overflow}
                </span>
              </div>
            )}
          </div>

          {/* Divider — only visible when collaborators are present */}
          <div className="mx-2 h-5 w-px bg-surface-border" />
        </>
      )}

      {/* Current user — Clerk's UserButton; must remain interactive */}
      <div className="pointer-events-auto">
        <UserButton />
      </div>
    </div>
  )
}
