import { z } from 'zod'

export function validateTaskStatusPayload(payload) {
  if (!payload || typeof payload !== 'object') return null

  const text = payload.text ?? payload.message
  if (text == null) return { text: '' }
  if (typeof text !== 'string') return null

  return { text: text.trim().slice(0, 240) }
}

export const AiChatMessageSchema = z.object({
  senderId: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(5000),
  timestamp: z.string(),
})

export function validateAiChatMessage(obj) {
  try {
    return AiChatMessageSchema.parse(obj?.payload ?? obj)
  } catch (e) {
    return null
  }
}
