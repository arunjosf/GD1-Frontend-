import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext.jsx';

import { CallProvider } from './context/CallContext.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Toaster containerStyle={{ zIndex: 99999 }} />
    <GoogleOAuthProvider clientId="91202562226-4ihbts6r617mgqui3ni8d2o15hmio4t1.apps.googleusercontent.com">
      <AuthProvider>
        <CallProvider>
          <App />
        </CallProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </BrowserRouter>
)

