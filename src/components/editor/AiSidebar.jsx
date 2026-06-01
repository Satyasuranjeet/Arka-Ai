import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useEventListener, useOthers, useBroadcastEvent, useSelf } from '@liveblocks/react'
import { useLiveblocksFlow } from '@liveblocks/react-flow'
import { useRealtimeRun } from '@trigger.dev/react-hooks'
import { marked } from 'marked'
import { Bot, X, Send, FileText, Download, Loader2, Eye, Moon, Sun, Sparkles } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { createApiClient } from '@/lib/api'
import { validateTaskStatusPayload, validateAiChatMessage } from '@/utils/taskValidator'

const STARTER_PROMPTS = [
  'Design an e-commerce backend',
  'Create a chat app architecture',
  'Build a CI/CD pipeline',
]

function formatTimeLabel(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function Avatar({ name, avatarUrl }) {
  const initials = (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?'

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="h-5 w-5 rounded-full border border-surface-border object-cover"
      />
    )
  }

  return (
    <div className="flex h-5 w-5 items-center justify-center rounded-full border border-surface-border bg-subtle text-[10px] font-semibold text-copy-secondary">
      {initials}
    </div>
  )
}

function MessageBubble({ role, content, senderName, senderAvatar, timestamp }) {
  const timeLabel = formatTimeLabel(timestamp)

  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%]">
          <div className="mb-1 flex items-center justify-end gap-1.5 text-[10px] text-copy-faint">
            {timeLabel ? <span>{timeLabel}</span> : null}
            <span>{senderName}</span>
            <Avatar name={senderName} avatarUrl={senderAvatar} />
          </div>
          <div className="rounded-2xl border-2 border-brand/50 bg-brand-dim px-3 py-2 text-sm text-copy-primary">
            {content}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <div className="mb-1 flex items-center gap-1.5 text-[10px] text-copy-faint">
          <Avatar name={senderName} avatarUrl={senderAvatar} />
          <span>{senderName}</span>
          {timeLabel ? <span>{timeLabel}</span> : null}
        </div>
        <div className="rounded-2xl border border-surface-border bg-elevated px-3 py-2 text-sm text-ai-text">
          {content}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onPromptClick }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-3 py-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ai/10">
        <Bot className="h-6 w-6 text-ai-text" />
      </div>
      <p className="text-center text-xs text-copy-muted">
        Ask Arka Ai to help design your system architecture.
      </p>
      <div className="flex w-full flex-col gap-2">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPromptClick(prompt)}
            className="rounded-full border border-surface-border bg-subtle px-3 py-2 text-left text-xs text-ai-text transition-colors hover:border-surface-border-subtle hover:bg-elevated"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}

function AiStatusIndicator({ active }) {
  if (!active) return null

  return (
    <div className="flex items-center gap-2 rounded-xl border border-ai/30 bg-ai/10 px-3 py-2 text-xs text-ai-text">
      <span className="h-2 w-2 rounded-full bg-ai animate-pulse" />
      Arka Ai is thinking
    </div>
  )
}

function StatusSnapshot({ text }) {
  if (!text) return null

  return (
    <div className="rounded-xl border border-surface-border bg-elevated px-3 py-2 text-xs leading-relaxed text-copy-secondary">
      {text}
    </div>
  )
}

function ArchitectPanel({ aiThinking, latestStatus, chatMessages, onSendChat, runActive, sendError, participantMeta }) {
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef(null)

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isSending || aiThinking) return
    setInput('')
    setIsSending(true)

    try {
      await onSendChat(text)
    } catch (error) {
      // show a local assistant error bubble
      // append via onSendChat failure is handled by parent
    } finally {
      setIsSending(false)
    }
  }, [aiThinking, input, isSending, onSendChat])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    },
    [sendMessage],
  )

  const handlePromptClick = useCallback((prompt) => {
    if (aiThinking) return
    setInput(prompt)
    textareaRef.current?.focus()
  }, [aiThinking])

  const hasMessages = chatMessages.length > 0

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Message area */}
      <ScrollArea className="flex-1">
        <div className="flex min-h-full flex-col gap-3 p-3">
          <AiStatusIndicator active={aiThinking} />
          <StatusSnapshot text={latestStatus} />
          {hasMessages ? (
            <div className="flex flex-col gap-3">
              {chatMessages.map((msg, i) => {
                const meta = participantMeta[msg.senderId] || {
                  name: msg.role === 'user' ? 'You' : 'Arka Ai',
                  avatar: '',
                }

                return (
                  <MessageBubble
                    key={`${msg.senderId}-${msg.timestamp}-${i}`}
                    role={msg.role}
                    content={msg.content}
                    senderName={meta.name}
                    senderAvatar={meta.avatar}
                    timestamp={msg.timestamp}
                  />
                )
              })}
            </div>
          ) : (
            <EmptyState onPromptClick={handlePromptClick} />
          )}
        </div>
      </ScrollArea>

      {/* Input footer */}
      <div className="flex-shrink-0 border-t border-surface-border p-3">
        {runActive ? (
          <div className="mb-2 flex items-center gap-2 rounded-md border border-ai/30 bg-ai/8 px-2 py-1 text-xs text-ai-text">
            <span className="h-2 w-2 rounded-full bg-ai animate-pulse" />
            <span className="truncate">{latestStatus || 'Running design task...'}</span>
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={aiThinking || runActive}
            placeholder="Ask Arka Ai…"
            className="min-h-[72px] max-h-[160px] flex-1 resize-none border-surface-border bg-elevated text-sm text-copy-primary placeholder:text-copy-faint focus-visible:ring-ai/30 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={!input.trim() || isSending || aiThinking || runActive}
            className="h-9 w-9 flex-shrink-0 bg-ai text-white hover:bg-ai/80"
          >
            {isSending || aiThinking || runActive ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {sendError ? <p className="mt-1.5 text-[11px] text-error">{sendError}</p> : null}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Markdown renderer config (safe subset — no html passthrough)
// ---------------------------------------------------------------------------
marked.setOptions({ gfm: true, breaks: true })

// ---------------------------------------------------------------------------
// Spec preview dialog
// ---------------------------------------------------------------------------

function SpecPreviewModal({ spec, projectId, getToken, open, onClose }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [dimmed, setDimmed] = useState(false)

  useEffect(() => {
    if (!open || !spec) return
    setContent('')
    setLoading(true)
    const { apiFetch } = createApiClient(getToken)
    apiFetch(`/api/projects/${projectId}/specs/${spec.specId}/download`, {}, 'text')
      .then((text) => setContent(text ?? ''))
      .catch(() => setContent('_Failed to load spec content._'))
      .finally(() => setLoading(false))
  }, [open, spec, projectId, getToken])

  const handleDownload = useCallback(async () => {
    if (!spec) return
    const { apiFetch } = createApiClient(getToken)
    try {
      const blob = await apiFetch(
        `/api/projects/${projectId}/specs/${spec.specId}/download`,
        {},
        'blob',
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = spec.filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      /* ignore — network errors are silent here */
    }
  }, [spec, projectId, getToken])

  const renderedHtml = content ? marked.parse(content) : ''

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="flex max-h-[80vh] max-w-2xl min-h-0 flex-col gap-0 overflow-hidden rounded-3xl border border-surface-border bg-elevated p-0"
        showCloseButton={false}
        onEscapeKeyDown={onClose}
      >
        <DialogHeader className="flex-shrink-0 border-b border-surface-border px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-ai/10">
                <FileText className="h-4 w-4 text-ai-text" />
              </div>
              <DialogTitle className="text-sm font-semibold text-copy-primary">
                {spec?.filename ?? 'Spec Preview'}
              </DialogTitle>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-copy-muted transition-colors hover:bg-subtle hover:text-copy-primary"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-copy-muted" />
            </div>
          ) : (
            <div
              className={`spec-markdown p-5 text-sm leading-relaxed text-copy-primary transition-opacity duration-300 ${dimmed ? 'opacity-30' : 'opacity-100'}`}
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          )}
        </ScrollArea>

        <DialogFooter className="sticky bottom-0 flex-shrink-0 flex items-center justify-between border-t border-surface-border bg-elevated px-5 py-3">
          <button
            onClick={() => setDimmed((d) => !d)}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-copy-muted transition-colors hover:bg-subtle hover:text-copy-primary"
            aria-label="Toggle dimming"
          >
            {dimmed ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {dimmed ? 'Undim' : 'Dim'}
          </button>
          <Button
            size="sm"
            onClick={handleDownload}
            className="gap-1.5 bg-ai text-white hover:bg-ai/80"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Specs tab panel
// ---------------------------------------------------------------------------

function SpecsPanel({ projectId, getToken, chatMessages, onGenerateSpec, isGenerating, refreshTrigger }) {
  const [specs, setSpecs] = useState([])
  const [loadingList, setLoadingList] = useState(false)
  const [selectedSpec, setSelectedSpec] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const loadSpecs = useCallback(() => {
    if (!projectId) return
    setLoadingList(true)
    const { apiFetch } = createApiClient(getToken)
    apiFetch(`/api/projects/${projectId}/specs`)
      .then((data) => setSpecs(Array.isArray(data) ? data : []))
      .catch(() => setSpecs([]))
      .finally(() => setLoadingList(false))
  }, [projectId, getToken])

  useEffect(() => {
    loadSpecs()
  }, [loadSpecs, refreshTrigger])

  const handleDownload = useCallback(
    async (e, spec) => {
      e.stopPropagation()
      const { apiFetch } = createApiClient(getToken)
      try {
        const blob = await apiFetch(
          `/api/projects/${projectId}/specs/${spec.specId}/download`,
          {},
          'blob',
        )
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = spec.filename
        a.click()
        URL.revokeObjectURL(url)
      } catch {
        /* ignore */
      }
    },
    [projectId, getToken],
  )

  const openPreview = useCallback((spec) => {
    setSelectedSpec(spec)
    setPreviewOpen(true)
  }, [])

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-3">
          {/* Generate Spec Button */}
          <Button
            onClick={onGenerateSpec}
            disabled={isGenerating || chatMessages.length === 0}
            className="w-full gap-2 bg-ai text-white hover:bg-ai/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Spec
              </>
            )}
          </Button>

          {loadingList ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-copy-muted" />
            </div>
          ) : specs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ai/10">
                <FileText className="h-5 w-5 text-ai-text" />
              </div>
              <p className="text-xs text-copy-muted">
                No specs generated yet. Use the AI Architect tab to design your system, then generate a spec.
              </p>
            </div>
          ) : (
            specs.map((spec) => (
              <button
                key={spec.specId}
                onClick={() => openPreview(spec)}
                className="group flex w-full items-center gap-3 rounded-xl border border-surface-border bg-elevated px-3 py-2.5 text-left transition-colors hover:border-surface-border-subtle hover:bg-subtle"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-ai/10">
                  <FileText className="h-4 w-4 text-ai-text" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-medium text-copy-primary">
                    {spec.filename}
                  </p>
                  <p className="text-[11px] text-copy-muted">{formatDate(spec.created_at)}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => handleDownload(e, spec)}
                    className="rounded-md p-1 text-copy-muted transition-colors hover:bg-base hover:text-copy-primary"
                    aria-label="Download spec"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <Eye className="h-3.5 w-3.5 text-copy-faint" />
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      <SpecPreviewModal
        spec={selectedSpec}
        projectId={projectId}
        getToken={getToken}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Realtime run subscriber — only mounted when runId + publicToken are live
// Keeps useRealtimeRun away from null accessToken which throws on mount
// ---------------------------------------------------------------------------

function RealtimeRunSubscriber({ runId, publicToken, onRunUpdate }) {
  const { run, error } = useRealtimeRun(runId, {
    accessToken: publicToken,
    onComplete: onRunUpdate,
  })
  useEffect(() => {
    if (error) {
      onRunUpdate({ status: 'error', message: error.message, output: null })
    }
  }, [error, onRunUpdate])

  useEffect(() => {
    if (run?.status && !run.finishedAt) {
      onRunUpdate(run)
    }
  }, [run, onRunUpdate])
  return null
}

/**
 * AiSidebar — floating AI chat sidebar mounted on the right of the workspace.
 *
 * Props:
 *   onClose  () => void   — called when the close button is clicked
 */
export function AiSidebar({ onClose, projectId }) {
  const others = useOthers()
  const [latestStatus, setLatestStatus] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [sendError, setSendError] = useState('')
  const [runId, setRunId] = useState(null)
  const [publicToken, setPublicToken] = useState(null)
  const [runActive, setRunActive] = useState(false)
  const [specRunId, setSpecRunId] = useState(null)
  const [specPublicToken, setSpecPublicToken] = useState(null)
  const [specRunActive, setSpecRunActive] = useState(false)
  const [specsRefreshTrigger, setSpecsRefreshTrigger] = useState(0)
  const aiThinking = others.some((user) => user.presence.thinking === true)
  const broadcast = useBroadcastEvent()
  const self = useSelf()
  const { getToken } = useAuth()
  
  // Get canvas data for spec generation
  const { nodes = [], edges = [] } = useLiveblocksFlow() || {}

  const participantMeta = useMemo(() => {
    const map = {
      'ghost-ai': { name: 'Arka Ai', avatar: '' },
      system: { name: 'System', avatar: '' },
    }

    const selfInfo = self?.info
    if (self?.id) {
      map[self.id] = {
        name: selfInfo?.name || 'You',
        avatar: selfInfo?.avatar || '',
      }
    }

    for (const other of others) {
      if (!other?.id) continue
      map[other.id] = {
        name: other.info?.name || 'Collaborator',
        avatar: other.info?.avatar || '',
      }
    }

    return map
  }, [others, self])

  const appendChatMessage = useCallback((message) => {
    setChatMessages((prev) => {
      const alreadyExists = prev.some(
        (m) =>
          m.senderId === message.senderId &&
          m.timestamp === message.timestamp &&
          m.content === message.content,
      )

      return alreadyExists ? prev : [...prev, message]
    })
  }, [])

  const handleRunUpdate = useCallback(
    (realtimeRun) => {
      const status = realtimeRun?.status ?? realtimeRun?.state ?? realtimeRun?.data?.status
      const message =
        realtimeRun?.message ?? realtimeRun?.output?.message ?? realtimeRun?.data?.message ?? ''

      if (message) setLatestStatus(String(message))

      const s = String(status ?? '').toLowerCase()
      if (s === 'complete' || s === 'completed' || s === 'succeeded' || s === 'success') {
        const finalMsg = {
          senderId: 'ghost-ai',
          role: 'assistant',
          content: message || 'Design complete',
          timestamp: new Date().toISOString(),
        }
        const valid = validateAiChatMessage({ payload: finalMsg })
        if (valid) {
          appendChatMessage(valid)
          try { broadcast({ type: 'ai-chat', payload: valid }) } catch { /* ignore */ }
        }
        setRunActive(false)
        setRunId(null)
        setPublicToken(null)
      } else if (s === 'error' || s === 'failed' || s === 'errored') {
        const finalMsg = {
          senderId: 'ghost-ai',
          role: 'assistant',
          content: message || 'Design failed',
          timestamp: new Date().toISOString(),
        }
        const valid = validateAiChatMessage({ payload: finalMsg })
        if (valid) {
          appendChatMessage(valid)
          try { broadcast({ type: 'ai-chat', payload: valid }) } catch { /* ignore */ }
        }
        setRunActive(false)
        setRunId(null)
        setPublicToken(null)
      } else if (s) {
        setRunActive(true)
      }
    },
    [appendChatMessage, broadcast],
  )

  const handleSpecRunUpdate = useCallback(
    async (realtimeRun) => {
      const status = realtimeRun?.status ?? realtimeRun?.state ?? realtimeRun?.data?.status
      const output = realtimeRun?.output ?? realtimeRun?.data?.output
      const markdown = output?.markdown
      const hasFinalMarkdown = typeof markdown === 'string' && markdown.trim().length > 0

      const s = String(status ?? '').toLowerCase()
      if (hasFinalMarkdown || s === 'complete' || s === 'completed' || s === 'succeeded' || s === 'success') {
        if (hasFinalMarkdown) {
          try {
            const { apiFetch } = createApiClient(getToken)
            await apiFetch(`/api/projects/${projectId}/specs`, {
              method: 'POST',
              body: JSON.stringify({ content: markdown }),
            })
            // Trigger specs list refresh
            setSpecsRefreshTrigger((n) => n + 1)
          } catch (err) {
            console.error('Failed to save spec:', err)
          }
        }
        setSpecRunActive(false)
        setSpecRunId(null)
        setSpecPublicToken(null)
      } else if (s === 'error' || s === 'failed' || s === 'errored') {
        setSpecRunActive(false)
        setSpecRunId(null)
        setSpecPublicToken(null)
      } else if (s) {
        setSpecRunActive(true)
      }
    },
    [getToken, projectId],
  )

  useEventListener(({ event }) => {
    if (event?.type !== 'ai-status-feed') return
    const payload = validateTaskStatusPayload(event)
    if (payload) setLatestStatus(payload.text)

    const phase = event?.phase
    if (runActive && (phase === 'complete' || phase === 'error')) {
      const finalMsg = {
        senderId: 'ghost-ai',
        role: 'assistant',
        content: event?.text ?? (phase === 'complete' ? 'Design complete' : 'Design failed'),
        timestamp: new Date().toISOString(),
      }
      const valid = validateAiChatMessage({ payload: finalMsg })
      if (valid) {
        appendChatMessage(valid)
        try {
          broadcast({ type: 'ai-chat', payload: valid })
        } catch (e) {
          /* ignore */
        }
      }

      setRunActive(false)
      setRunId(null)
      setPublicToken(null)
    }
  })

  useEventListener(({ event }) => {
    if (event?.type !== 'ai-chat') return
    const payload = validateAiChatMessage(event)
    if (!payload) return
    appendChatMessage(payload)
  })

  const handleSendChat = async (text) => {
    setSendError('')

    const message = {
      senderId: self?.id ?? 'unknown',
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }

    const valid = validateAiChatMessage({ payload: message })
    if (!valid) throw new Error('Invalid chat message')

    // Optimistically append locally
    appendChatMessage(valid)

    // Broadcast to room
    try {
      broadcast({ type: 'ai-chat', payload: valid })
    } catch (e) {
      setSendError('Message failed to send. Please check your connection and try again.')
      // on failure, append an assistant-style error
      appendChatMessage({
        senderId: 'system',
        role: 'assistant',
        content: 'Failed to send message',
        timestamp: new Date().toISOString(),
      })
      throw e
    }

    // Now trigger the design run and capture run tokens
    try {
      const { apiFetch } = createApiClient(getToken)
      const data = await apiFetch('/api/ai/design', {
        method: 'POST',
        body: JSON.stringify({ prompt: text, projectId, roomId: `project-${projectId}` }),
      })

      const rid = data?.run_id
      if (!rid) throw new Error('No run id returned from API')
      setRunId(rid)
      setRunActive(true)

      if (data?.public_token) {
        setPublicToken(data.public_token)
      } else {
        const tokenRes = await apiFetch('/api/ai/design/token', {
          method: 'POST',
          body: JSON.stringify({ runId: rid }),
        })
        if (tokenRes?.public_token) setPublicToken(tokenRes.public_token)
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to start design run')
      appendChatMessage({
        senderId: 'system',
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Failed to start design run',
        timestamp: new Date().toISOString(),
      })
      setRunActive(false)
      setRunId(null)
      setPublicToken(null)
      throw err
    }
  }

  const handleGenerateSpec = async () => {
    try {
      setSpecRunActive(true)
      const { apiFetch } = createApiClient(getToken)
      
      // Prepare chat history and canvas data
      const chatHistory = chatMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))
      
      const data = await apiFetch('/api/ai/spec', {
        method: 'POST',
        body: JSON.stringify({
          roomId: `project-${projectId}`,
          chatHistory,
          nodes,
          edges,
        }),
      })

      const rid = data?.run_id
      if (!rid) throw new Error('No run id returned from spec generation API')
      setSpecRunId(rid)

      // Prefer the token returned by /api/ai/spec. Fall back to the token
      // endpoint only if the backend did not include one.
      if (data?.public_token) {
        setSpecPublicToken(data.public_token)
      } else {
        const tokenRes = await apiFetch('/api/ai/spec/token', {
          method: 'POST',
          body: JSON.stringify({ runId: rid }),
        })
        if (tokenRes?.public_token) {
          setSpecPublicToken(tokenRes.public_token)
        } else {
          throw new Error('Spec token was not returned by the backend')
        }
      }
    } catch (err) {
      console.error('Failed to start spec generation:', err)
      setSendError(err instanceof Error ? err.message : 'Failed to start spec generation')
      setSpecRunActive(false)
      setSpecRunId(null)
      setSpecPublicToken(null)
    }
  }

  return (
    <aside className="fixed top-14 right-2 bottom-2 z-30 flex w-72 flex-col overflow-hidden rounded-2xl border border-surface-border bg-base/95 shadow-2xl shadow-black/40 backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-shrink-0 items-start justify-between border-b border-surface-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-ai/10">
            <Bot className="h-4 w-4 text-ai-text" />
          </div>
          <div>
            <p className="text-sm font-semibold text-copy-primary">AI Workspace</p>
            <p className="text-[11px] text-copy-muted">Collaborate with Arka Ai</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-0.5 rounded-lg p-1 text-copy-muted transition-colors hover:bg-subtle hover:text-copy-primary"
          aria-label="Close AI sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabbed body */}
      <Tabs defaultValue="architect" className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-shrink-0 border-b border-surface-border px-3 pt-2">
          <TabsList className="w-full bg-subtle">
            <TabsTrigger
              value="architect"
              className="flex-1 data-active:bg-ai/20 data-active:text-ai-text text-copy-muted"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="flex-1 data-active:bg-ai/20 data-active:text-ai-text text-copy-muted"
            >
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="architect" className="flex flex-1 flex-col overflow-hidden m-0 p-0">
          <ArchitectPanel
            aiThinking={aiThinking}
            latestStatus={latestStatus}
            chatMessages={chatMessages}
            onSendChat={handleSendChat}
            runActive={runActive}
            sendError={sendError}
            participantMeta={participantMeta}
          />
        </TabsContent>

        <TabsContent value="specs" className="flex flex-1 flex-col overflow-hidden m-0 p-0">
          <SpecsPanel 
            projectId={projectId} 
            getToken={getToken} 
            chatMessages={chatMessages}
            onGenerateSpec={handleGenerateSpec}
            isGenerating={specRunActive}
            refreshTrigger={specsRefreshTrigger}
          />
        </TabsContent>
      </Tabs>

      {/* Only mount the Trigger realtime subscribers when we actually have live runs */}
      {runId && publicToken && (
        <RealtimeRunSubscriber
          runId={runId}
          publicToken={publicToken}
          onRunUpdate={handleRunUpdate}
        />
      )}
      {specRunId && specPublicToken && (
        <RealtimeRunSubscriber
          runId={specRunId}
          publicToken={specPublicToken}
          onRunUpdate={handleSpecRunUpdate}
        />
      )}
    </aside>
  )
}
