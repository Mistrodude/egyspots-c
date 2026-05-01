import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useTheme } from '../context/ThemeContext';
import { useAuth }  from '../context/AuthContext';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

const ERROR_MAP = {
  'auth/wrong-password':          'Incorrect password. Try again.',
  'auth/invalid-credential':      'Incorrect email or password.',
  'auth/user-not-found':          'No account found with that email.',
  'auth/email-already-in-use':    'An account with this email already exists.',
  'auth/weak-password':           'Password must be at least 8 characters.',
  'auth/invalid-email':           'Please enter a valid email address.',
  'auth/too-many-requests':       'Too many attempts. Please wait a moment.',
  'auth/network-request-failed':                          'Network error. Check your connection.',
  'auth/popup-closed-by-user':                            'Sign-in popup was closed. Try again.',
  'auth/operation-not-supported-in-this-environment':     'Use email and password to sign in on the mobile app.',
};

function parseError(e) {
  return ERROR_MAP[e?.code] ||
    e.message?.replace('Firebase: ', '').replace(/\s*\(auth\/[^)]+\)\.?\s*/, '').trim() ||
    'Something went wrong. Please try again.';
}

const EGYPTIAN_CITIES = ['Cairo', 'Giza', 'Alexandria', 'Helwan', '6th of October', 'Shorouk', 'New Cairo', 'Obour', 'Badr', 'Other'];

const Spinner = ({ color = 'white' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: 'spin 0.8s linear infinite', marginRight: 6 }}>
    <circle cx="12" cy="12" r="10" stroke={color === 'white' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)'} strokeWidth="3" fill="none" />
    <path d={`M12 2a10 10 0 0 1 10 10`} stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
  </svg>
);

export default function AuthScreen({ onBack }) {
  const { t } = useTheme();
  const { signIn, signUp, signInGoogle, signInApple, checkUsernameAvailable } = useAuth();
  const isNative = Capacitor.isNativePlatform();

  const [mode,         setMode]         = useState('signin');
  const [loading,      setLoading]      = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error,        setError]        = useState('');
  const [info,         setInfo]         = useState('');

  // Sign-in fields
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  // Sign-up fields
  const [name,           setName]           = useState('');
  const [username,       setUsername]       = useState('');
  const [signupEmail,    setSignupEmail]    = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPass,    setConfirmPass]    = useState('');
  const [phone,          setPhone]          = useState('+20');
  const [birthDate,      setBirthDate]      = useState('');
  const [gender,         setGender]         = useState('');
  const [city,           setCity]           = useState('Cairo');
  const [language,       setLanguage]       = useState('ar');
  const [agreedTerms,    setAgreedTerms]    = useState(false);

  const [usernameStatus, setUsernameStatus] = useState('idle'); // idle | checking | available | taken

  const switchMode = (m) => { setMode(m); setError(''); setInfo(''); };

  // Username uniqueness check on blur
  const handleUsernameBlur = async () => {
    const val = username.trim().toLowerCase();
    if (!val || val.length < 3) return;
    setUsernameStatus('checking');
    const available = await checkUsernameAvailable(val);
    setUsernameStatus(available ? 'available' : 'taken');
  };

  const calcAge = (dob) => {
    if (!dob) return null;
    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  };

  const validateSignup = () => {
    if (!name.trim())                    return 'Please enter your full name.';
    if (!username.trim())                return 'Please choose a username.';
    if (username.length < 3)             return 'Username must be at least 3 characters.';
    if (!/^[a-z0-9_]+$/i.test(username)) return 'Username can only contain letters, numbers and underscores.';
    if (usernameStatus === 'taken')      return 'That username is already taken.';
    if (!signupEmail.trim())             return 'Please enter your email.';
    if (!signupPassword)                 return 'Please enter a password.';
    if (signupPassword.length < 8)       return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(signupPassword))   return 'Password must contain at least one uppercase letter.';
    if (!/[0-9]/.test(signupPassword))   return 'Password must contain at least one number.';
    if (signupPassword !== confirmPass)  return 'Passwords do not match.';
    if (!phone || phone.length < 8)      return 'Please enter a valid phone number.';
    if (!birthDate)                      return 'Please enter your date of birth.';
    const age = calcAge(birthDate);
    if (age < 13)                        return 'You must be 13 or older to use Egyspots.';
    if (!gender)                         return 'Please select your gender.';
    if (!agreedTerms)                    return 'Please agree to the Terms of Service.';
    return null;
  };

  const submitSignIn = async () => {
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (!password)     { setError('Please enter your password.'); return; }
    setError(''); setInfo(''); setLoading(true);
    try {
      await signIn(email.trim(), password);
      onBack();
    } catch (e) {
      setError(parseError(e));
    } finally {
      setLoading(false);
    }
  };

  const submitSignUp = async () => {
    const validationError = validateSignup();
    if (validationError) { setError(validationError); return; }
    setError(''); setInfo(''); setLoading(true);
    try {
      await signUp(signupEmail.trim(), signupPassword, {
        displayName: name.trim(),
        username:    username.trim().toLowerCase(),
        phoneNumber: phone,
        birthDate,
        gender,
        city,
        language,
      });
      setInfo('Account created! Check your email for a verification link, then sign in.');
      setTimeout(() => onBack(), 3000);
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

  const handleApple = async () => {
    setError(''); setInfo(''); setLoading(true);
    try {
      await signInApple();
      onBack();
    } catch (e) {
      if (e?.code !== 'auth/popup-closed-by-user') setError(parseError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) { setError('Enter your email above first, then tap Forgot Password.'); return; }
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

  const inp = {
    width: '100%', padding: '13px 16px', borderRadius: 14,
    border: `1px solid ${t.border}`, background: t.surface, color: t.text,
    fontSize: 14, fontFamily: 'Outfit, sans-serif', outline: 'none',
    boxSizing: 'border-box',
  };

  const sel = { ...inp, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' };

  const usernameColor = usernameStatus === 'available' ? '#4A9E6B' : usernameStatus === 'taken' ? '#D06A50' : t.muted;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg, overflowY: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 24px 40px', minHeight: '100%' }}>

        {/* Logo */}
        <div style={{
          width: 72, height: 72, borderRadius: 22,
          background: `linear-gradient(135deg, ${t.accent}33, ${t.accent}66)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16, border: `1.5px solid ${t.accent}44`,
        }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: t.accent }}>ES</span>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: t.text, marginBottom: 6 }}>EgySpots</div>
        <div style={{ fontSize: 13, color: t.muted, marginBottom: 28, textAlign: 'center' }}>
          Discover where Cairo hangs out tonight
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', background: t.surface2, borderRadius: 14, padding: 3, marginBottom: 24, width: '100%', maxWidth: 360 }}>
          {['signin', 'signup'].map((m) => (
            <button key={m} onClick={() => switchMode(m)} style={{
              flex: 1, padding: '10px 0', borderRadius: 12,
              border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
              background: mode === m ? t.accent : 'transparent',
              color:      mode === m ? 'white'  : t.muted,
              fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
            }}>
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 11 }}>

          {/* ── SIGN IN FIELDS ── */}
          {mode === 'signin' && (
            <>
              <input value={email} onChange={(e) => setEmail(e.target.value)}
                type="email" placeholder="Email" style={inp} autoComplete="email"
                onKeyDown={(e) => e.key === 'Enter' && submitSignIn()} />
              <input value={password} onChange={(e) => setPassword(e.target.value)}
                type="password" placeholder="Password" style={inp} autoComplete="current-password"
                onKeyDown={(e) => e.key === 'Enter' && submitSignIn()} />
              <button onClick={handleForgotPassword} disabled={resetLoading} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: t.accent, fontSize: 12, fontFamily: 'Outfit, sans-serif',
                textAlign: 'right', padding: '0 2px', opacity: resetLoading ? 0.6 : 1,
              }}>
                {resetLoading ? 'Sending…' : 'Forgot password?'}
              </button>
            </>
          )}

          {/* ── SIGN UP FIELDS ── */}
          {mode === 'signup' && (
            <>
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Your name" style={inp} autoComplete="name" />

              <div style={{ position: 'relative' }}>
                <input value={username} onChange={(e) => { setUsername(e.target.value.replace(/\s/g, '')); setUsernameStatus('idle'); }}
                  onBlur={handleUsernameBlur}
                  placeholder="@username" style={{ ...inp, paddingRight: 80 }} autoComplete="username" />
                {usernameStatus !== 'idle' && (
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 600, color: usernameColor }}>
                    {usernameStatus === 'checking' ? '…' : usernameStatus === 'available' ? '✓ Available' : '✗ Taken'}
                  </span>
                )}
              </div>

              <input value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)}
                type="email" placeholder="Email" style={inp} autoComplete="email" />

              <input value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)}
                type="password" placeholder="Password (min 8, 1 uppercase, 1 number)" style={inp} autoComplete="new-password" />

              <input value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
                type="password" placeholder="Confirm password" style={inp} autoComplete="new-password" />

              <div style={{ position: 'relative' }}>
                <input value={phone} onChange={(e) => setPhone(e.target.value)}
                  type="tel" placeholder="+201001234567" style={inp} autoComplete="tel" />
              </div>

              <div>
                <div style={{ fontSize: 11, color: t.muted, marginBottom: 5, paddingLeft: 2 }}>Date of Birth *</div>
                <input value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                  type="date" style={inp} max={new Date(Date.now() - 13 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} />
                {birthDate && calcAge(birthDate) < 13 && (
                  <div style={{ fontSize: 11, color: t.error, marginTop: 4, paddingLeft: 2 }}>
                    Egyspots is for users 13 and older.
                  </div>
                )}
              </div>

              <select value={gender} onChange={(e) => setGender(e.target.value)} style={sel}>
                <option value="">Select gender *</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>

              <select value={city} onChange={(e) => setCity(e.target.value)} style={sel}>
                {EGYPTIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              <div style={{ display: 'flex', gap: 8 }}>
                {[{ val: 'ar', label: 'العربية' }, { val: 'en', label: 'English' }].map(({ val, label }) => (
                  <button key={val} onClick={() => setLanguage(val)} style={{
                    flex: 1, padding: '11px 0', borderRadius: 12,
                    border: `1px solid ${language === val ? t.accent : t.border}`,
                    background: language === val ? t.accentBg : t.surface,
                    color: language === val ? t.accentText : t.muted,
                    cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 600,
                  }}>
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <button onClick={() => setAgreedTerms((v) => !v)} style={{
                  width: 20, height: 20, borderRadius: 6, marginTop: 1, flexShrink: 0,
                  border: `1.5px solid ${agreedTerms ? t.accent : t.border}`,
                  background: agreedTerms ? t.accent : 'transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {agreedTerms && <span style={{ color: 'white', fontSize: 12, fontWeight: 800 }}>✓</span>}
                </button>
                <span style={{ fontSize: 12, color: t.muted, lineHeight: 1.5 }}>
                  I agree to the{' '}
                  <span style={{ color: t.accent, cursor: 'pointer' }} onClick={() => window.open('https://egyspots-dc9c1.web.app/terms.html', '_system')}>Terms of Service</span>
                  {' '}and{' '}
                  <span style={{ color: t.accent, cursor: 'pointer' }} onClick={() => window.open('https://egyspots-dc9c1.web.app/privacy.html', '_system')}>Privacy Policy</span>
                </span>
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div style={{ fontSize: 12, color: t.error, background: t.errorBg, padding: '9px 12px', borderRadius: 10, border: `1px solid ${t.error}33` }}>
              {error}
            </div>
          )}
          {info && (
            <div style={{ fontSize: 12, color: t.success, background: t.successBg, padding: '9px 12px', borderRadius: 10, border: `1px solid ${t.success}33` }}>
              {info}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={mode === 'signin' ? submitSignIn : submitSignUp}
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
              marginTop: 2,
            }}
          >
            {loading && <Spinner />}
            {loading
              ? (mode === 'signin' ? 'Signing in…' : 'Creating account…')
              : (mode === 'signin' ? 'Sign In' : 'Create Account')}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0' }}>
            <div style={{ flex: 1, height: 1, background: t.border }} />
            <span style={{ fontSize: 11, color: t.muted }}>or</span>
            <div style={{ flex: 1, height: 1, background: t.border }} />
          </div>

          {isNative && (
            <div style={{ fontSize: 11, color: t.muted, textAlign: 'center', padding: '2px 0 4px', lineHeight: 1.5 }}>
              Social sign-in is not available in the mobile app yet — use email and password above.
            </div>
          )}

          {/* Google */}
          <button onClick={isNative ? undefined : handleGoogle} disabled={loading || isNative} style={{
            padding: 14, borderRadius: 16,
            background: t.surface, color: t.text,
            border: `1px solid ${t.border}`,
            cursor: isNative ? 'default' : loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            opacity: isNative || loading ? 0.35 : 1,
          }}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.3 0 6.3 1.1 8.7 3.3l6.5-6.5C35 2.8 29.9.5 24 .5 14.8.5 7 6.1 3.5 13.9l7.6 5.9C12.9 13.7 17.9 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.7-.2-3.3-.5-4.9H24v9.3h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.4z"/>
              <path fill="#FBBC05" d="M11.1 28.6A14 14 0 019.5 24a14 14 0 011.6-4.6L3.5 13.5A23 23 0 00.5 24c0 3.8.9 7.4 2.5 10.5l8.1-5.9z"/>
              <path fill="#34A853" d="M24 47.5c5.9 0 10.9-2 14.5-5.4l-7.5-5.8c-2 1.4-4.6 2.2-7 2.2-6.1 0-11.1-4.1-12.9-9.9l-8.1 5.9C7 42 14.8 47.5 24 47.5z"/>
            </svg>
            Continue with Google
          </button>

          {/* Apple */}
          <button onClick={isNative ? undefined : handleApple} disabled={loading || isNative} style={{
            padding: 14, borderRadius: 16,
            background: isNative ? t.surface2 : '#000', color: isNative ? t.muted : '#fff',
            border: isNative ? `1px solid ${t.border}` : '1px solid #000',
            cursor: isNative ? 'default' : loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            opacity: isNative || loading ? 0.35 : 1,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isNative ? t.muted : 'white'}>
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Sign in with Apple
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
    </div>
  );
}
