Read `AGENTS.md` and `context/ui-context.md` before starting.

Clerk is already installed and connected. Wire it into the React + Python app: provider, auth pages, redirects, client-side route protection, user menu, and Python backend JWT verification.

## Design

Use Clerk’s `dark` theme from `@clerk/themes` as the base.

Override Clerk appearance variables using the app’s existing CSS variables from `globals.css`. Do not hardcode colors.

Sign-in and sign-up pages:
- Large screens: Simple two-panel layout
- Left: Compact logo, tagline, short text-only feature list
- Right: Centered Clerk `<SignIn />` or `<SignUp />` form component
- Small screens: Clerk form only
- No gradients, no oversized hero sections, no feature cards, and no scroll-heavy layouts

Keep the layout minimal and professional.

## Implementation

### 1. React Frontend Setup
- Wrap the application entry point (e.g., `src/main.jsx` or `src/index.jsx`) with `ClerkProvider` using Clerk’s `dark` theme from `@clerk/themes`.
- Create sign-in and sign-up page layouts using standard Clerk components (e.g., `/sign-in` and `/sign-up` client routes).
- Define public routes using existing sign-in and sign-up environment variables. Protect all other frontend views by default via your React Router wrapper.
- Update the `/` path behavior:
  - Authenticated users redirect to `/editor`
  - Unauthenticated users redirect to `/sign-in`
- Add Clerk’s built-in `<UserButton />` to the right section of the `src/components/editor/EditorNavbar.jsx` component for profile settings and logout.
- Keep Clerk’s default user menu and profile flows intact. Do not rebuild or heavily customize Clerk internals.
- Use existing Clerk environment variables (e.g., `VITE_CLERK_PUBLISHABLE_KEY`). Do not rename or invent new ones.

### 2. Python Backend Setup
- Because we are using a standalone Python backend instead of a Next.js middleware, protect your backend API endpoints by validating the incoming Clerk JWT backend token.
- Parse the `Authorization: Bearer <token>` header from incoming frontend requests.
- Use your backend Clerk environment variables (e.g., `CLERK_SECRET_KEY`) or the JWKS endpoint to verify claims.
- Return a `401 Unauthorized` response if the token is missing or invalid.

## Dependencies

Install on frontend: `@clerk/clerk-react`, `@clerk/themes`.
Ensure Python backend JWT dependencies (such as `python-jose` or similar) are correctly configured.

## Check When Done

- `ClerkProvider` successfully wraps the React root layout.
- All frontend client-side routes are protected except public auth paths.
- Auth pages cleanly inherit CSS variables with no hardcoded colors.
- The Python backend successfully intercepts and validates Clerk JWT tokens on protected API endpoints.
- Frontend compilation (`npm run build` or equivalent) and backend execution pass without errors.