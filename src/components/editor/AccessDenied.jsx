import { Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

export function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-elevated">
          <Lock className="h-7 w-7 text-copy-muted" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-base font-semibold text-copy-primary">
            Access Denied
          </h1>
          <p className="max-w-xs text-sm text-copy-muted">
            You don't have permission to view this workspace.
          </p>
        </div>
        <Link
          to="/editor"
          className="text-sm text-brand hover:underline underline-offset-4"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
