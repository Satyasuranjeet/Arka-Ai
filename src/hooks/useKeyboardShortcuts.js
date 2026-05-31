/**
 * useKeyboardShortcuts — global keyboard shortcut handler for canvas actions.
 *
 * Binds shortcuts to the window keydown event. All handlers are silently skipped
 * when the active element is a text input, textarea, or contenteditable field so
 * that typing inside node labels or edge labels is never interrupted.
 *
 * Supported shortcuts:
 *   +  or  =        → zoom in
 *   -               → zoom out
 *   Ctrl/Cmd + Z    → undo
 *   Ctrl/Cmd + Shift + Z  → redo
 *   Ctrl/Cmd + Y    → redo (alternate)
 *
 * @param {React.RefObject} rfInstance  - React Flow instance ref (from onInit)
 * @param {Function}        undo        - Liveblocks undo callback
 * @param {Function}        redo        - Liveblocks redo callback
 */

import { useEffect } from 'react'

const ANIM = { duration: 200 }

function isTypingTarget(el) {
  if (!el) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true
  if (el.isContentEditable) return true
  return false
}

export function useKeyboardShortcuts(rfInstance, undo, redo) {
  useEffect(() => {
    function handleKeyDown(e) {
      // Never intercept keys while the user is typing in a text field
      if (isTypingTarget(document.activeElement)) return

      const ctrl = e.ctrlKey || e.metaKey

      // Redo: Ctrl/Cmd + Shift + Z
      if (ctrl && e.shiftKey && (e.key === 'Z' || e.key === 'z')) {
        e.preventDefault()
        redo()
        return
      }

      // Redo: Ctrl/Cmd + Y (alternate)
      if (ctrl && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault()
        redo()
        return
      }

      // Undo: Ctrl/Cmd + Z
      if (ctrl && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        undo()
        return
      }

      // Zoom shortcuts — only when no modifier is held
      if (!ctrl && !e.shiftKey && !e.altKey) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault()
          rfInstance.current?.zoomIn(ANIM)
          return
        }
        if (e.key === '-') {
          e.preventDefault()
          rfInstance.current?.zoomOut(ANIM)
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [rfInstance, undo, redo])
}
