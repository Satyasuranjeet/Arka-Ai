Read `AGENTS.md` and `context/ui-context.md` before starting.

We're adding the design system and UI primitive components.

Install and configure `shadcn/ui` for a React + JavaScript environment.

Add these shadcn components:

- Button
- Card
- Dialog
- Input
- Tabs
- Textarea
- ScrollArea

Do not modify the generated `src/components/ui/*` files after installation.

Also Install `lucide-react`.

Create `src/lib/utils.js` with a reusable `cn()` helper for merging Tailwind classes.

Ensure all components match the existing dark theme in `globals.css`.

### Check when done

- All components import without errors into `.jsx` files
- `cn()` works properly
- No default light styling appears