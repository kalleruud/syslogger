import './index.css'
import LogsView from './app/views/LogsView'
import { TopBar } from './app/components/TopBar'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme='dark' storageKey='theme'>
      <div>
        <TopBar />
        <LogsView />
      </div>
    </ThemeProvider>
  </StrictMode>
)
