import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthScreen from '../screens/AuthScreen';

vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    t: {
      bg: '#0D0B14', surface: '#15121E', surface2: '#1D1928',
      border: '#2A2440', text: '#EDE9F8', muted: '#6B6185',
      accent: '#A78BFA', accentBg: '#1E1830',
      shadow: '0 2px 16px rgba(0,0,0,0.5)',
      shadow2: '0 8px 32px rgba(0,0,0,0.7)',
    },
  }),
}));

const mockSignIn       = vi.fn();
const mockSignUp       = vi.fn();
const mockSignInGoogle = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    signIn:       mockSignIn,
    signUp:       mockSignUp,
    signInGoogle: mockSignInGoogle,
  }),
}));

vi.mock('firebase/auth', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../firebase', () => ({
  auth: {},
}));

// Helper: get the submit button (large padded button, not the tab toggle)
function getSubmitButton() {
  return screen.getAllByRole('button').find(
    (btn) => btn.textContent === 'Sign In' && parseInt(btn.style.padding) >= 14
  );
}

describe('AuthScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password fields', () => {
    render(<AuthScreen onBack={vi.fn()} />);
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('renders EgySpots branding', () => {
    render(<AuthScreen onBack={vi.fn()} />);
    expect(screen.getByText('EgySpots')).toBeInTheDocument();
    expect(screen.getByText(/Discover where Cairo/)).toBeInTheDocument();
  });

  it('switches to sign-up mode and shows name field', () => {
    render(<AuthScreen onBack={vi.fn()} />);
    // Click the Sign Up tab toggle
    const signUpTab = screen.getAllByRole('button').find(
      (btn) => btn.textContent === 'Sign Up' && !btn.style.padding?.includes('14')
    );
    fireEvent.click(signUpTab);
    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
  });

  it('shows validation error when submitting with empty email', async () => {
    render(<AuthScreen onBack={vi.fn()} />);
    const submitBtn = screen.getAllByRole('button').find(
      (btn) => btn.textContent === 'Sign In' && btn.style.borderRadius === '16px'
    );
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText(/Please enter your email/i)).toBeInTheDocument();
    });
  });

  it('calls signIn with email and password', async () => {
    mockSignIn.mockResolvedValueOnce({});
    const onBack = vi.fn();
    render(<AuthScreen onBack={onBack} />);

    fireEvent.change(screen.getByPlaceholderText('Email'),    { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });

    const submitBtn = screen.getAllByRole('button').find(
      (btn) => btn.textContent === 'Sign In' && btn.style.borderRadius === '16px'
    );
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@test.com', 'password123');
      expect(onBack).toHaveBeenCalled();
    });
  });

  it('shows human-readable error for wrong password', async () => {
    const error = new Error('Firebase: wrong password');
    error.code  = 'auth/wrong-password';
    mockSignIn.mockRejectedValueOnce(error);
    render(<AuthScreen onBack={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Email'),    { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrongpass' } });

    const submitBtn = screen.getAllByRole('button').find(
      (btn) => btn.textContent === 'Sign In' && btn.style.borderRadius === '16px'
    );
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Incorrect password. Try again.')).toBeInTheDocument();
    });
  });

  it('shows "Forgot password?" link in sign-in mode', () => {
    render(<AuthScreen onBack={vi.fn()} />);
    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
  });

  it('hides "Forgot password?" in sign-up mode', () => {
    render(<AuthScreen onBack={vi.fn()} />);
    const signUpTab = screen.getAllByRole('button').find(
      (btn) => btn.textContent === 'Sign Up' && !btn.style.padding?.includes('14')
    );
    fireEvent.click(signUpTab);
    expect(screen.queryByText('Forgot password?')).not.toBeInTheDocument();
  });
});
