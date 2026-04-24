import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider }  from './context/AuthContext';
import { SpotsProvider } from './context/SpotsContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { StoriesProvider } from './context/StoriesContext';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <SpotsProvider>
          <NotificationsProvider>
            <StoriesProvider>
              <App />
            </StoriesProvider>
          </NotificationsProvider>
        </SpotsProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
