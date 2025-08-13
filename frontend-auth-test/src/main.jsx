import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AuthTest from './authTest.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthTest/>
  </StrictMode>,
)
