import { useAuth } from '@clerk/clerk-react'
import { LiveblocksProvider } from '@liveblocks/react'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export function AuthenticatedLiveblocksProvider({ children }) {
  const { getToken } = useAuth()

  async function authEndpoint(room) {
    const token = await getToken()
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(`${API_BASE_URL}/api/liveblocks-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ room }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }))
      throw new Error(error.detail ?? `Liveblocks auth failed: ${response.status}`)
    }

    return response.json()
  }

  return (
    <LiveblocksProvider authEndpoint={authEndpoint}>
      {children}
    </LiveblocksProvider>
  )
}
