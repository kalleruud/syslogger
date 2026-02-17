/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import App from '@/frontend/App'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AutoscrollProvider } from './contexts/AutoscrollContext'
import { ConnectionProvider } from './contexts/ConnectionContext'
import { DataProvider } from './contexts/DataContext'
import { FilterProvider } from './contexts/FilterContext'

const elem = document.getElementById('root')!
const app = (
  <StrictMode>
    <ConnectionProvider>
      <FilterProvider>
        <DataProvider>
          <AutoscrollProvider>
            <App />
          </AutoscrollProvider>
        </DataProvider>
      </FilterProvider>
    </ConnectionProvider>
  </StrictMode>
)

if (import.meta.hot) {
  // With hot module reloading, `import.meta.hot.data` is persisted.
  const root = (import.meta.hot.data.root ??= createRoot(elem))
  root.render(app)
} else {
  // The hot module reloading API is not available in production.
  createRoot(elem).render(app)
}
