Read `AGENTS.md` and `context/ui-context.md` before starting.

We're adding the base chrome components that frame every editor screen — the top navbar and the left sidebar shell. These will be reused and extended in every chapter that follows.

### Editor Navbar

Create `src/components/editor/EditorNavbar.jsx`.

Requirements:
- Fixed-height top navbar
- Left, center, and right sections
- Left section contains a sidebar toggle button
- Use `PanelLeftOpen` / `PanelLeftClose` icons from `lucide-react` based on frontend sidebar state
- Right section stays empty for now
- Dark background with subtle bottom border matching the existing `globals.css` tokens

---

### Project Sidebar

Create `src/components/editor/ProjectSidebar.jsx`.

Requirements:
- Sidebar should float over the editor canvas (use absolute/fixed positioning so opening it does not push page content)
- Slides in smoothly from the left
- Accepts an `isOpen` prop (managed by frontend React state)
- Header containing a `Projects` title and a close button
- Use Shadcn `Tabs` (`src/components/ui/tabs.jsx`):
  - My Projects
  - Shared
- Both tabs display an empty placeholder state for now (will connect to the Python backend API in a later step)
- Full-width `New Project` button at the bottom utilizing a `Plus` icon from `lucide-react`

---

### Dialog Pattern

Use the existing color tokens from `globals.css` for dialog styling using the Shadcn Dialog primitives (`src/components/ui/dialog.jsx`).

Support:
- Title
- Description
- Footer actions

Do not build actual feature-specific dialogs or backend endpoints yet; just ensure the layout pattern is structurally ready.

### Check when done

- New components import and compile without JavaScript or React errors
- No lint errors
- Dialog pattern is ready for future integration with frontend state and Python API triggers