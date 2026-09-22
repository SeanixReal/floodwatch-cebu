import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

/* Self-hosted font: the demo has to work with the Wi-Fi switched off. */
import '@fontsource-variable/plus-jakarta-sans'
import './index.css'

import App from './App'
import { AppStateProvider } from './state/AppState'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppStateProvider>
        <App />
      </AppStateProvider>
    </BrowserRouter>
  </StrictMode>,
)
