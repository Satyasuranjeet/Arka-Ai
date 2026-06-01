/**
 * Creates a fetch wrapper that automatically attaches the Clerk JWT
 * as a Bearer token to every request sent to the Python backend.
 *
 * @param {() => Promise<string | null>} getToken - The getToken function from useAuth()
 */
export function createApiClient(getToken) {
  const BASE_URL = import.meta.env.VITE_API_URL ?? ''

  /**
   * @param {string} path - API path (e.g. '/api/projects')
   * @param {RequestInit} [options] - Standard fetch options
   * @param {'json'|'text'|'blob'} [responseType] - How to parse the response body
   */
  async function apiFetch(path, options = {}, responseType = 'json') {
    const token = await getToken()
    if (!token) throw new Error('Not authenticated')

    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(error.detail ?? `Request failed: ${res.status}`)
    }

    if (res.status === 204) return null
    if (responseType === 'text') return res.text()
    if (responseType === 'blob') return res.blob()
    return res.json()
  }

  return { apiFetch }
}
