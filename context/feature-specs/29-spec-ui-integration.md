Read `AGENTS.md` and `context/ui-context.md` before starting.

# Integrate Specification Generation Results into the AI Sidebar

## Goal
Integrate specification generation results into the editor workspace so users can browse, preview, and download completed specs directly from the existing AI Sidebar's Specs tab layer.

## Implementation

1. Build the Interactive Specification List.
   - Inside the right floating sidebar's Specs tab (`src/components/editor/AiSidebar.jsx`), add a dedicated history list view layer.
   - Fetch the available specification metadata array from your Python backend via the project query endpoint (`GET /api/projects/{project_id}/specs`).
   - For each spec record card item, cleanly render:
     - Formatted creation date (`createdAt` / `created_at`)
     - Clean file identification name string (`filename`)
   - Keep the list layout compact, scrollable using Shadcn's `<ScrollArea />` container, and style individual items to be simple, clickable row items.

2. Create the Document Preview Modal.
   - Launch an interactive Shadcn `<Dialog />` modal overlay whenever an item row from the specification list is clicked.
   - Fetch the raw content body for the selected item behind the scenes through your secure backend proxy endpoint—**never query the database collection paths or cloud raw buckets directly from the client application**.
   - Render the returned plain string content directly on screen as clean HTML Markdown using your project's markdown rendering utilities or classes.
   - Integrate an explicit header close button action, a footer dimming toggle, and basic keyboard event listeners (such as closing out the viewport on `Escape` keydown frames).

3. Integrate the Download File Action.
   - Embed a functional file download action icon/button helper in two tactical view locations: next to each item in the sidebar list, and inside the main body of the preview modal wrapper.
   - Direct the action handler to point window clicks or network streams directly to your Python backend attachment route: `/api/projects/{project_id}/specs/{spec_id}/download`.
   - Let the browser natively capture and process the incoming backend response header stream (`Content-Disposition: attachment`) to trigger an immediate local file transfer download.

## UI Details & Style Systems

- **Layout Constraints:** Maintain your exact running sidebar structure intact. Do not re-architect tab distributions or layout structures.
- **Component Kit Rules:** Exclusively build layout structures using your standard Shadcn/ui component interfaces (`Dialog`, `ScrollArea`, `Button`, etc.).
- **Theme Matching:** Extract typography weights, list row spacing grids, and surface tokens directly from your `src/globals.css` and `context/ui-context.md` files. Maintain clean visual contrast ratios against your dark canvas workspace layout.

## Scope Limits

- Don’t construct, modify, or extend Python backend API endpoints or mock controller functions during this task block.
- Don’t attempt to circumvent security layer filters by downloading database collection items directly from client-side network fetch scopes.
- Don’t cache or maintain extensive Markdown spec document texts inside a heavy frontend state manager tree or global store layer long-term.
- Don’t append unnecessary global canvas state variables or layout handlers outside the immediate sidebar UI component context.

## Check When Done

- The Specs panel accurately requests and loads available specification logs for the active project space on initialization.
- The preview dialog dynamically fetches, parses, and displays the correct Markdown text layout on row click selection frames.
- Clicking the download action successfully forces browser attachment streams without exposing underlying document storage roots.
- The interactive list operates smoothly within a compact, independent vertical scrolling grid container.
- The React frontend application compiles and builds completely via Vite without any syntax, hook, or execution errors.