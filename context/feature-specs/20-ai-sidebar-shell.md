Read `AGENTS.md` and `context/ui-context.md` before starting.

Complete the existing AI sidebar placeholder and turn it into a proper floating chat sidebar component. The sidebar already exists, so keep the current floating placement and smooth slide-in behavior from the right side. This unit is focused on building out the sidebar UI inside it.

## Implementation

1. Separate the AI sidebar into its own localized React component (`src/components/editor/AiSidebar.jsx`).
   - Keep the sidebar open/close boolean state completely controlled by the parent layout container.
   - Preserved intact the exact existing slide-in CSS animation, floating layout position, custom borders, background blur, and shadow styling.
   - Use your sidebar surface styling tokens like `bg-base/95`, `border-surface-border`, and the current shadow treatment.

2. Add the sidebar header structure.
   - Title string: `AI Workspace`
   - Subtitle string: `Collaborate with Arka Ai`
   - Render a small bot icon (using a Lucide icon or custom SVG layout).
   - Position a close button aligned explicitly to the right-hand corner.
   - Assign `text-primary-text` class to the title header.
   - Assign `text-muted-text` class to the subtitle paragraph.

3. Add a tabbed navigation layout featuring two distinct tabs.
   - Use Shadcn's JavaScript-configured `<Tabs />` components.
   - Tab 1: `AI Architect`
   - Tab 2: `Specs`
   - Apply active tab styling rules using your workspace tokens like `bg-accent` and `text-accent`.
   - Ensure inactive tab typography text stays properly muted with the `text-muted-text` class.

4. Build out the AI Architect panel view layer.
   - Utilize standard Shadcn React element variations where appropriate, specifically `<Button />` and `<Textarea />`.
   - Integrate a scrollable message log viewport area (`overflow-y-auto`).
   - Render an initial empty state container containing a center-aligned bot icon, a short instruction description, and clickable starter prompt cards.
   - Provide these exact starter chips:
     - `Design an e-commerce backend`
     - `Create a chat app architecture`
     - `Build a CI/CD pipeline`
   - Style the starter chips as soft pill layouts using `bg-subtle` and `text-accent-text`.
   - Right-align incoming User messages with styling set to: `bg-brand-dim border-brand/50 border-2 text-copy-primary`.
   - Left-align Assistant messages with styling set to: `bg-elevated border border-surface-border text-accent-text`.
   - Assemble the prompt input footer area featuring an auto-resizing textarea block setting explicit boundaries: around 72px min-height and 160px max-height.
   - Assign the send action button a styling of `bg-accent text-white`.
   - Capture keyboard interactions: `Enter` fires form submission events immediately, while `Shift + Enter` inserts a normal newline character break.

5. Build out the Specs panel view layer.
   - Render a functional action trigger button labeled `Generate Spec` styled using `bg-accent text-white`.
   - Embed a static demo specification card layout for the current phase.
   - Style this placeholder card using `bg-elevated` and `border-surface-border`.
   - Include a file/spec icon item, a placeholder text title, a short technical copy snippet, and a disabled file download button accessory.

6. Strictly utilize existing project color system tokens.
   - Double-check your `src/globals.css`, `context/ui-context.md`, or the global Tailwind configuration mapping values before declaring raw text strings or direct color hexes. Do not introduce new hardcoded color properties if a mapped variable already matches.

## Scope Limits

- Don’t rewrite or break the layout wrapper's existing open/close toggle logic.
- Don’t implement Python backend REST route APIs, controller functions, or endpoint structures yet.
- Don’t attach live socket-based real-time Liveblocks room streams or mock LLM token generation pipelines yet.
- Keep this completely focused on building the interactive frontend sidebar interface structure.

## Check When Done

- The AI chat sidebar is fully isolated inside its own standalone React component module.
- The original floating slide-in layout positioning behavior performs smoothly without jarring layout shifts.
- The component correctly supports and mounts the interactive AI Architect and Specs panel views.
- The AI Architect panel displays a clean empty state layout, populated starter chip items, and responsive input boundaries.
- The Specs tab layout properly embeds the generation action button and the static demo card container.
- The React frontend application compiles and builds successfully without any syntax, hook, or rendering errors.