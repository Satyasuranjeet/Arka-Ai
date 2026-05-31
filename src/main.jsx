import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import { LiveblocksProvider } from '@liveblocks/react'
import './index.css'
import App from './App.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const LIVEBLOCKS_PUBLIC_KEY = import.meta.env.VITE_LIVEBLOCKS_PUBLIC_KEY

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} appearance={{ baseTheme: dark }}>
        <LiveblocksProvider publicApiKey={LIVEBLOCKS_PUBLIC_KEY}>
          <App />
        </LiveblocksProvider>
      </ClerkProvider>
    </BrowserRouter>
  </StrictMode>,
)
