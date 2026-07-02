import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { seedDatabase } from './db/seed'
import './index.css'

async function requestPersistentStorage() {
  if (navigator.storage?.persist) {
    const granted = await navigator.storage.persist()
    if (!granted) {
      console.warn('Persistent storage not granted — data may be evicted under storage pressure')
    }
  }
}

seedDatabase().then(() => {
  requestPersistentStorage()
  if (import.meta.env.DEV) {
    import('./lib/dev-readiness').then((m) => m.installReadinessDevTools())
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
})
