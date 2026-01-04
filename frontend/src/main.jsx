import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="256019568842-pl55dhoqv2quqr142orqlj71o4h6nuo7.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
