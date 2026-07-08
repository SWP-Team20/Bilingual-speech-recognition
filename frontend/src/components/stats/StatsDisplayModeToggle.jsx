import { colors, radius } from '../../theme';

const MODES = [
  { value: 'count', label: 'Количество' },
  { value: 'percent', label: 'Проценты' },
];

function StatsDisplayModeToggle({ mode, onChange }) {
  return (
    <div
      role="group"
      aria-label="Режим отображения графика"
      style={{
        display: 'inline-flex',
        border: `1px solid ${colors.borderStrong}`,
        borderRadius: radius.sm,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {MODES.map(({ value, label }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(value)}
            style={{
              border: 'none',
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: active ? colors.primary : colors.surface,
              color: active ? '#fff' : colors.text,
              transition: 'background-color 0.15s ease, color 0.15s ease',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default StatsDisplayModeToggle;
