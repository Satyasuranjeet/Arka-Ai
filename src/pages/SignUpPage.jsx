import { SignUp } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import { AuthLeftPanel } from './AuthLeftPanel'

const clerkAppearance = {
  baseTheme: dark,
  elements: {
    card: {
      backgroundColor: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '1rem',
      boxShadow: 'none',
    },
    headerTitle: { color: 'var(--foreground)' },
    headerSubtitle: { color: 'var(--muted-foreground)' },
    socialButtonsBlockButton: {
      backgroundColor: 'var(--muted)',
      borderColor: 'var(--border)',
      color: 'var(--foreground)',
    },
    dividerLine: { backgroundColor: 'var(--border)' },
    dividerText: { color: 'var(--muted-foreground)' },
    formFieldLabel: { color: 'var(--muted-foreground)' },
    formFieldInput: {
      backgroundColor: 'var(--muted)',
      borderColor: 'var(--border)',
      color: 'var(--foreground)',
    },
    formButtonPrimary: {
      backgroundColor: 'var(--primary)',
      color: 'var(--primary-foreground)',
    },
    footerActionLink: { color: 'var(--primary)' },
    identityPreviewEditButton: { color: 'var(--primary)' },
    formFieldErrorText: { color: 'var(--destructive)' },
    alertText: { color: 'var(--destructive)' },
  },
}

export function SignUpPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-base">
      <AuthLeftPanel />

      {/* Right panel — Clerk form */}
      <div className="flex flex-1 items-center justify-center overflow-y-auto p-8">
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          appearance={clerkAppearance}
        />
      </div>
    </div>
  )
}
