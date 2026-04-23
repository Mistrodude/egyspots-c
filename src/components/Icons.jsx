const I = (d, viewBox = '0 0 24 24') => ({ color, size = 22 }) => (
  <svg width={size} height={size} viewBox={viewBox} fill="none"
    stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

export const ExploreIcon = I(<polygon points="3 11 22 2 13 21 11 13 3 11" />);
export const SearchIcon  = I(<><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="22" y2="22" /></>);
export const ChatIcon    = I(<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />);
export const ProfileIcon = I(<><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></>);
export const BackIcon    = I(<polyline points="15 18 9 12 15 6" />);
export const HeartIcon   = I(<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />);
export const SendIcon    = I(<><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>);
export const CameraIcon  = I(<><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></>);
export const CafeIcon    = I(<><path d="M18 8h1a4 4 0 010 8h-1" /><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></>);
export const FoodIcon    = I(<><line x1="3" y1="11" x2="21" y2="11" /><path d="M5 11V6a7 7 0 0114 0v5" /><path d="M12 11v8m-4 0h8" /></>);
export const CarIcon     = I(<><path d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h14a2 2 0 012 2v2" /><rect x="11" y="11" width="12" height="8" rx="2" /><circle cx="7" cy="17" r="2" /><circle cx="19" cy="17" r="2" /></>);
export const ParkIcon    = I(<><path d="M17 8C8 10 5.9 16.17 3.82 22h3.63L9 18c.87.37 1.89.58 3 .58s2.13-.21 3-.58l2.1 4.24h3.18C18 16 14 10 17 8z" /><path d="M9 3.8a4 4 0 008 0 7.48 7.48 0 01-8 0z" /></>);
export const AirIcon     = I(<><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></>);
export const LocateIcon  = I(<><circle cx="12" cy="12" r="4" /><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /></>);

export const AllIcon = ({ color, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <circle cx="5" cy="5" r="2" /><circle cx="12" cy="5" r="2" /><circle cx="19" cy="5" r="2" />
    <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
    <circle cx="5" cy="19" r="2" /><circle cx="12" cy="19" r="2" /><circle cx="19" cy="19" r="2" />
  </svg>
);

export const MoreIcon = ({ color, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
  </svg>
);

export const CATEGORY_ICONS = {
  All:           AllIcon,
  Cafes:         CafeIcon,
  'Street Food': FoodIcon,
  Shisha:        CafeIcon,
  'Car Meets':   CarIcon,
  Parks:         ParkIcon,
  'Open Air':    AirIcon,
};

export function SpotIcon({ category, color, size = 20 }) {
  const map = {
    Cafe:         CafeIcon,
    'Car Meet':   CarIcon,
    'Street Food':FoodIcon,
    Park:         ParkIcon,
    'Open Air':   AirIcon,
    Traditional:  CafeIcon,
  };
  const Comp = map[category] || CafeIcon;
  return <Comp color={color} size={size} />;
}
