/**
 * Liveblocks room configuration.
 *
 * Presence — per-user ephemeral state synced in real-time across all
 * connected clients in the same room:
 *
 *   cursor      {x: number, y: number} | null
 *                 Canvas pointer position; null when cursor leaves the canvas.
 *   thinking    boolean
 *                 True while the AI copilot is generating a response for
 *                 this user (shows a "thinking" indicator to collaborators).
 *
 * UserMeta — immutable metadata attached to each session token by the
 * backend auth endpoint and accessible via useOthers / useSelf:
 *
 *   id           string   Clerk user ID (set by Liveblocks from userId)
 *   info.name    string   Display name resolved via Clerk API
 *   info.avatar  string   Avatar image URL from Clerk
 *   info.color   string   Hex cursor color, deterministically assigned
 *                         per user in backend/app/core/liveblocks.py
 */

/**
 * Initial Presence state for each connected user.
 * Passed as the `initialPresence` prop on every <RoomProvider />.
 *
 * @type {{ cursor: {x: number, y: number} | null, thinking: boolean }}
 */
export const INITIAL_PRESENCE = {
  cursor: null,
  thinking: false,
}
