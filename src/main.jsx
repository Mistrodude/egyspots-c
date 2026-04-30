import React from 'react';
import ReactDOM from 'react-dom/client';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('App crash:', error, info?.componentStack); }
  render() {
    if (this.state.hasError) {
      return React.createElement('div', {
        style: { height: '100%', background: '#0D0B14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, fontFamily: 'Outfit, sans-serif' },
      },
        React.createElement('div', { style: { fontSize: 40, marginBottom: 16 } }, '😵'),
        React.createElement('div', { style: { fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 8 } }, 'Something crashed'),
        React.createElement('div', { style: { fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginBottom: 24 } }, this.state.error?.message || 'An unexpected error occurred.'),
        React.createElement('button', {
          onClick: () => window.location.reload(),
          style: { border: 'none', background: '#A78BFA', color: 'white', borderRadius: 10, padding: '12px 28px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14 },
        }, 'Reload App'),
      );
    }
    return this.props.children;
  }
}

const showErr = (msg) => {
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#0d0b14;color:#f55;padding:24px;font-family:monospace;font-size:12px;white-space:pre-wrap;word-break:break-all;z-index:99999;overflow:auto;';
  d.textContent = msg;
  if (document.body) document.body.appendChild(d);
  else document.addEventListener('DOMContentLoaded', () => document.body.appendChild(d));
};

async function boot() {
  try {
    await import('./index.css');
    const [
      { ThemeProvider },
      { AuthProvider },
      { SpotsProvider },
      { NotificationsProvider },
      { StoriesProvider },
      { default: App },
    ] = await Promise.all([
      import('./context/ThemeContext'),
      import('./context/AuthContext'),
      import('./context/SpotsContext'),
      import('./context/NotificationsContext'),
      import('./context/StoriesContext'),
      import('./App'),
    ]);

    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <ErrorBoundary>
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
        </ErrorBoundary>
      </React.StrictMode>
    );
  } catch (e) {
    showErr('BOOT ERROR:\n' + (e && e.stack ? e.stack : String(e)));
  }
}

boot().catch((e) => showErr('FATAL:\n' + (e && e.stack ? e.stack : String(e))));
