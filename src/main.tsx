import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { composition } from './composition-root.ts'
import { SessionProvider } from './providers/session-context.tsx'

const rootElement = document.getElementById('root')
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <SessionProvider composition={composition}>
        <App />
      </SessionProvider>
    </StrictMode>,
  )
}
