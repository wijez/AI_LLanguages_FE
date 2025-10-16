import React, { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n/config.js'

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  
     <StrictMode>
      <Suspense fallback={null}>
       <App />
    </Suspense>

     </StrictMode>
)
