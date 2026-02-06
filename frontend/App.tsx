import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TopBar } from './app/components/TopBar'
import LogsView from './app/views/LogsView'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div>
      <TopBar />
      <LogsView />
    </div>
  </StrictMode>
)
