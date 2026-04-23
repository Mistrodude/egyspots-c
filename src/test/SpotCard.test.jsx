import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SpotCard from '../components/SpotCard';

// Mock ThemeContext
vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    t: {
      surface: '#15121E', border: '#2A2440', text: '#EDE9F8',
      muted: '#6B6185', accent: '#A78BFA', accentBg: '#1E1830',
      shadow: '0 2px 16px rgba(0,0,0,0.5)',
    },
  }),
}));

const MOCK_SPOT = {
  id:           'kazoku',
  name:         'Kazoku',
  category:     'Cafe',
  neighborhood: 'Zamalek',
  distance:     '0.3 km',
  crowd:        'Lively',
  crowdPct:     68,
  rating:       4.8,
  color:        '#C8A96E',
  vibe:         ['Late vibes', 'Shisha'],
};

// Mock CrowdBadge
vi.mock('../components/CrowdBadge', () => ({
  default: ({ crowd }) => <span data-testid="crowd-badge">{crowd}</span>,
}));

// Mock Icons
vi.mock('../components/Icons', () => ({
  SpotIcon: () => <svg data-testid="spot-icon" />,
}));

describe('SpotCard', () => {
  it('renders spot name', () => {
    render(<SpotCard spot={MOCK_SPOT} onPress={vi.fn()} checkedIn={false} />);
    expect(screen.getByText('Kazoku')).toBeInTheDocument();
  });

  it('renders neighborhood and distance', () => {
    render(<SpotCard spot={MOCK_SPOT} onPress={vi.fn()} checkedIn={false} />);
    expect(screen.getByText(/Zamalek/)).toBeInTheDocument();
    expect(screen.getByText(/0\.3 km/)).toBeInTheDocument();
  });

  it('renders rating', () => {
    render(<SpotCard spot={MOCK_SPOT} onPress={vi.fn()} checkedIn={false} />);
    expect(screen.getByText('4.8')).toBeInTheDocument();
  });

  it('shows HERE badge when checked in', () => {
    render(<SpotCard spot={MOCK_SPOT} onPress={vi.fn()} checkedIn={true} />);
    expect(screen.getByText('HERE')).toBeInTheDocument();
  });

  it('does not show HERE badge when not checked in', () => {
    render(<SpotCard spot={MOCK_SPOT} onPress={vi.fn()} checkedIn={false} />);
    expect(screen.queryByText('HERE')).not.toBeInTheDocument();
  });

  it('calls onPress with spot when clicked', () => {
    const onPress = vi.fn();
    render(<SpotCard spot={MOCK_SPOT} onPress={onPress} checkedIn={false} />);
    fireEvent.click(screen.getByText('Kazoku'));
    expect(onPress).toHaveBeenCalledWith(MOCK_SPOT);
  });

  it('renders crowd badge', () => {
    render(<SpotCard spot={MOCK_SPOT} onPress={vi.fn()} checkedIn={false} />);
    expect(screen.getByTestId('crowd-badge')).toBeInTheDocument();
  });
});
