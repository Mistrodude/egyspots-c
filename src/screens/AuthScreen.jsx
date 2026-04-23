import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

const ERROR_MAP = {
  'auth/wrong-password':          'Incorrect password. Try again.',
  'auth/invalid-credential':      'Incorrect email or password.',
  'auth/user-not-found':          'No account found with that email.',
  'auth/email-already-in-use':    'An account with this email already exists.',
  'auth/weak-password':           'Password must be at least 6 characters.',
  'auth/invalid-email':           'Please enter a valid email address.',
  'auth/too-many-requests':       'Too many attempts. Please try again later.',
  'auth/network-request-failed':  'Network error. Check your connection.',
  'auth/popup-closed-by-user':    'Sign-in popup was closed. Try again.',
};

function parseError(e) {
  const code = e?.code || '';
  if (ERROR_MAP[code]) return ERROR_MAP[code];
  return e.message?.replace('Firebase: ', '').replace(/\s*\(auth\/[^)]+\)\.?\s*/, '').trim()
    || 'Something went wrong. Please try again.';
}

export default function AuthScreen({ onBack }) {
  const { t }     = useTheme();
  const { signIn, signUp, signInGoogle } = useAuth();

  const [mode,         setMode]         = useState('signin');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [name,         setName]         = useState('');
  const [error,        setError]        = useState('');
  const [info,         setInfo]         = useState('');
  const [loading,      setLoading]      = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setInfo('');
  };

  const validate = () => {
    if (mode === 'signup' && !name.trim()) return 'Please enter your name.';
    if (!email.trim()) return 'Please enter your email.';
    if (!password) return 'Please enter your password.';
    if (mode === 'signup' && password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const submit = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError(''); setInfo(''); setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, name.trim());
      }
      onBack();
    } catch (e) {
      setError(parseError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(''); setInfo(''); setLoading(true);
    try {
      await signInGoogle();
      onBack();
    } catch (e) {
      setError(parseError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email above first, then tap Forgot Password.');
      return;
    }
    setResetLoading(true); setError(''); setInfo('');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo('Password reset email sent. Check your inbox.');
    } catch (e) {
      setError(parseError(e));
    } finally {
      setResetLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '13px 16px',
    borderRadius: 14, border: `1px solid ${t.border}`,
    background: t.surface, color: t.text,
    fontSize: 14, fontFamily: 'Outfit, sans-serif',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const Spinner = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: 'spin 0.8s linear infinite', marginRight: 6 }}>
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" fill="none" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg, overflowY: 'auto' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px 0' }}>

        {/* Logo */}
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: `linear-gradient(135deg, ${t.accent}33, ${t.accent}66)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20, border: `1.5px solid ${t.accent}44`,
        }}>
          <span style={{ fontSize: 32, fontWeight: 800, color: t.accent }}>ES</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: t.text, marginBottom: 8 }}>EgySpots</div>
        <div style={{ fontSize: 13, color: t.muted, marginBottom: 32, textAlign: 'center' }}>
          Discover where Cairo hangs out tonight
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', background: t.surface2, borderRadius: 14, padding: 3, marginBottom: 24, width: '100%', maxWidth: 360 }}>
          {['signin', 'signup'].map((m) => (
            <button key={m} onClick={() => switchMode(m)} style={{
              flex: 1, padding: '10px 0', borderRadius: 12,
              border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
              background: mode === m ? t.accent : 'transparent',
              color: mode === m ? 'white' : t.muted,
              fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
            }}>
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'signup' && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              style={inputStyle}
              autoComplete="name"
            />
          )}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            style={inputStyle}
            autoComplete="email"
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            style={inputStyle}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />

          {/* Forgot password — sign-in only */}
          {mode === 'signin' && (
            <button
              onClick={handleForgotPassword}
              disabled={resetLoading}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: t.accent, fontSize: 12, fontFamily: 'Outfit, sans-serif',
                textAlign: 'right', padding: '0 2px', opacity: resetLoading ? 0.6 : 1,
              }}
            >
              {resetLoading ? 'Sending…' : 'Forgot password?'}
            </button>
          )}

          {/* Error message */}
          {error && (
            <div style={{
              fontSize: 12, color: '#D06A50',
              background: 'rgba(208,106,80,0.12)',
              padding: '9px 12px', borderRadius: 10,
              border: '1px solid rgba(208,106,80,0.25)',
            }}>
              {error}
            </div>
          )}

          {/* Info message (password reset success) */}
          {info && (
            <div style={{
              fontSize: 12, color: '#4A9E6B',
              background: 'rgba(74,158,107,0.12)',
              padding: '9px 12px', borderRadius: 10,
              border: '1px solid rgba(74,158,107,0.25)',
            }}>
              {info}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            style={{
              padding: 14, borderRadius: 16,
              background: t.accent, color: 'white',
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 700,
              opacity: loading ? 0.75 : 1,
              boxShadow: `0 4px 16px ${t.accent}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'opacity 0.2s',
            }}
          >
            {loading && <Spinner />}
            {loading ? (mode === 'signin' ? 'Signing in…' : 'Creating account…') : (mode === 'signin' ? 'Sign In' : 'Create Account')}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: t.border }} />
            <span style={{ fontSize: 11, color: t.muted }}>or</span>
            <div style={{ flex: 1, height: 1, background: t.border }} />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            style={{
              padding: 14, borderRadius: 16,
              background: t.surface, color: t.text,
              border: `1px solid ${t.border}`,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              opacity: loading ? 0.7 : 1,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.3 0 6.3 1.1 8.7 3.3l6.5-6.5C35 2.8 29.9.5 24 .5 14.8.5 7 6.1 3.5 13.9l7.6 5.9C12.9 13.7 17.9 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.7-.2-3.3-.5-4.9H24v9.3h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.4z"/>
              <path fill="#FBBC05" d="M11.1 28.6A14 14 0 0 1 9.5 24a14 14 0 0 1 1.6-4.6L3.5 13.5A23 23 0 0 0 .5 24c0 3.8.9 7.4 2.5 10.5l8.1-5.9z"/>
              <path fill="#34A853" d="M24 47.5c5.9 0 10.9-2 14.5-5.4l-7.5-5.8c-2 1.4-4.6 2.2-7 2.2-6.1 0-11.1-4.1-12.9-9.9l-8.1 5.9C7 42 14.8 47.5 24 47.5z"/>
            </svg>
            Continue with Google
          </button>

          <button onClick={onBack} style={{
            padding: '10px', borderRadius: 12,
            background: 'transparent', color: t.muted,
            border: 'none', cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif', fontSize: 13,
          }}>
            Continue without signing in
          </button>
        </div>
      </div>
      <div style={{ height: 40 }} />
    </div>
  );
}
