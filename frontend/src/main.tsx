import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LocationProvider } from './context/LocationContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LocationProvider>
          <CartProvider>
            <App />
            <Toaster position="top-center" toastOptions={{
              style: { borderRadius: '14px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14 },
              success: { iconTheme: { primary: '#217844', secondary: '#fff' } },
            }} />
          </CartProvider>
        </LocationProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
