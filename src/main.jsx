import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import './index.css'
import App from './App.jsx'
import { AuthenticatedLiveblocksProvider } from './components/AuthenticatedLiveblocksProvider.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Browser extensions can emit this unhandled rejection in page context during
// development. It is unrelated to app logic and creates noisy console spam.
if (import.meta.env.DEV) {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason
    const message =
      typeof reason === 'string'
        ? reason
        : typeof reason?.message === 'string'
          ? reason.message
          : ''

    if (
      message.includes(
        'A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received',
      )
    ) {
      event.preventDefault()
    }
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} appearance={{ baseTheme: dark }}>
        <AuthenticatedLiveblocksProvider>
          <App />
        </AuthenticatedLiveblocksProvider>
      </ClerkProvider>
    </BrowserRouter>
  </StrictMode>,
)
