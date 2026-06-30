// Centralized design tokens. Import these instead of hardcoding hex values
// so the palette can be changed in one place.

export const colors = {
  // Brand / accent (green)
  primary: '#16a34a',
  primaryHover: '#15803d',
  primaryDeep: '#166534',
  primarySoft: '#dcfce7',
  primarySoftBorder: '#bbf7d0',

  // Danger (red)
  danger: '#d32f2f',
  dangerHover: '#b71c1c',
  dangerSoft: '#fdecea',
  dangerSoftBg: '#ffebee',
  dangerSoftBorder: '#ffcdd2',
  dangerText: '#c62828',

  // Neutrals
  dark: '#2b2b2b',
  darkHover: '#000000',
  text: '#000000',
  textStrong: '#111111',
  textMuted: '#555555',
  textSubtle: '#666666',
  textFaint: '#757575',
  disabled: '#bbbbbb',
  disabledBg: '#e0e0e0',

  surface: '#ffffff',
  page: '#f5f5f5',
  border: '#e6e6e6',
  borderStrong: '#dddddd',
  divider: '#eeeeee',
  waveform: '#d3d3d3',
  waveformScrub: '#9e9e9e',
};

export const radius = {
  sm: '8px',
  md: '10px',
  lg: '12px',
  xl: '16px',
  pill: '999px',
};

export const shadow = {
  sm: '0 1px 3px rgba(0,0,0,0.06)',
  md: '0 2px 10px rgba(0,0,0,0.05)',
  lg: '0 6px 18px rgba(0,0,0,0.10)',
  xl: '0 18px 50px rgba(0,0,0,0.10)',
  overlay: '0 20px 60px rgba(0,0,0,0.25)',
};

// Green focus ring used on inputs/selects
export const focusRing = '0 0 0 3px rgba(22,163,74,0.15)';

// Standard breakpoint for stacking the two-column layouts
export const MOBILE_BREAKPOINT = '(max-width: 860px)';
