import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { createApiClient } from '@/lib/api'

/**
 * Manual-save hook — saves canvas to the backend only when triggerSave() is called.
 *
 * @param {{ nodes: any[], edges: any[], projectId: string }} options
 * @returns {{ saveStatus: 'idle' | 'saving' | 'saved' | 'error', triggerSave: () => void }}
 */
export function useAutosave({ nodes, edges, projectId }) {
  const { getToken } = useAuth()
  const [saveStatus, setSaveStatus] = useState('idle')

  // Fresh refs so triggerSave always snapshots the latest canvas state.
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  useEffect(() => { nodesRef.current = nodes }, [nodes])
  useEffect(() => { edgesRef.current = edges }, [edges])

  const triggerSave = useCallback(async () => {
    if (!projectId) return
    setSaveStatus('saving')
    try {
      const { apiFetch } = createApiClient(getToken)
      await apiFetch(`/api/projects/${projectId}/canvas`, {
        method: 'PUT',
        body: JSON.stringify({ nodes: nodesRef.current, edges: edgesRef.current }),
      })
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    }
  }, [projectId, getToken])

  return { saveStatus, triggerSave }
}
