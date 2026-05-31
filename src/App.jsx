import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { SignInPage } from './pages/SignInPage'
import { SignUpPage } from './pages/SignUpPage'
import { WorkspacePage } from './pages/WorkspacePage'

function RootRedirect() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    )
  }

  return <Navigate to={isSignedIn ? '/editor' : '/sign-in'} replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />

      {/* All workspace routes require authentication */}
      <Route element={<ProtectedRoute />}>
        <Route path="/editor" element={<WorkspacePage />} />
        <Route path="/editor/:projectId" element={<WorkspacePage />} />
      </Route>
    </Routes>
  )
}

export default App
