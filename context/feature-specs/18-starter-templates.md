Read `AGENTS.md` and `context/ui-context.md` before starting.

Add a small starter template library so users can start a canvas from a pre-built diagram instead of building from scratch.

## Implementation

1. Create a template data configuration file at `src/components/editor/starterTemplates.js`.

   Include:
   - Documentation or structures detailing a `CanvasTemplate` object format.
   - A `CANVAS_TEMPLATES` constant array.
   - At least three pre-defined architecture templates: a Microservices Architecture, a CI/CD Pipeline, and an Event-Driven System.

   Each template object must include:
   - `id` (String)
   - `name` (String)
   - `description` (String)
   - `nodes` (Array of predefined React Flow node objects)
   - `edges` (Array of predefined React Flow edge objects)

   *Note: Use your shared canvas property constants and the existing node color palette definitions. Add clean helper functions where appropriate to keep the template position coordinates clean and readable.*

2. Create a Shadcn-based template selection dialog component at `src/components/editor/StarterTemplatesModal.jsx`.

   The modal must:
   - Open cleanly as an interactive dialog overlay.
   - Display the available template choice cards inside a scrollable grid container.
   - Show the specific template's name text and description copy prominently.
   - Include an interactive "Import Template" action button for each card.
   - Call an `onImport` handler function passing down the selected template payload, and automatically close the dialog view instantly on success.

3. Add a simple, lightweight diagram graphic preview to each template card.
   - Fit and contain the preview drawing within a small fixed-size aspect ratio viewport wrapper.
   - Compute and scale the local preview boundary constraints dynamically from the absolute node coordinates inside that template.
   - Draw edges simply as clean visual lines (`<line>` or `<path>`) stretched directly between the computed node centers.
   - Render the nodes using small corresponding inline CSS/SVG shapes matching their specified configuration shape and color theme values.
   - Keep this preview canvas exceptionally lightweight using raw HTML/SVG elements—**do not** instantiate a secondary heavy React Flow instance inside the card loop.

4. Wire the starter templates infrastructure into your workspace shell layout.
   - Add a dedicated button item to your main top navbar (`src/components/editor/EditorNavbar.jsx`) to open the Starter Templates Dialog.
   - When a template is imported, fully clear and purge all existing nodes and edges arrays out of your canvas room state first.
   - Add and push the selected template's nodes and edges datasets directly into the empty array slots immediately after the canvas is successfully flushed.
   - *Enforce absolute state replacement:* Ensure the starter template content completely overrides and replaces the current viewport workspace instead of inadvertently rendering on top of old existing node work.
   - Trigger React Flow's `fitView` positioning animation method immediately after the replacement template state maps to screen.
   - Keep this transaction block entirely synchronized inside your client-side collaborative Liveblocks room storage state hook loops.

## Scope Limits

- Don’t add custom layout template saving workflows or exporting mechanisms yet.
- Don’t add user-created or local-storage custom layout templates.
- Don’t introduce Python backend REST routes, database collection updates, or MongoDB persistence layers for these templates yet.
- Don’t alter or modify existing real-time canvas node styles or edge line rendering behaviors.
- Keep this unit strictly focused on clearing the active canvas and importing predefined local configurations.

## Check When Done

- Template collection properties are organized using shared frontend canvas variables and layouts.
- The import modal successfully maps template choice cards with clean visual SVG preview windows.
- The import trigger fully replaces active canvas states through your existing Liveblocks node/edge sync flow layers.
- The editor workspace top navbar includes the modal launcher entry action.
- The React frontend application compiles and builds successfully without any syntax, styling, or runtime execution errors.