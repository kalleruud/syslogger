import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TopBar } from './components/TopBar'
import './index.css'
import LogsView from './views/LogsView'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div>
      <TopBar />
      <LogsView />
    </div>
  </StrictMode>
)
