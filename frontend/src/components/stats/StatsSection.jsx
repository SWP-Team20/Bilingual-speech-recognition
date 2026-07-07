import { colors, radius, shadow } from '../../theme';

function StatsSection({ title, description, children, placeholder }) {
  return (
    <section
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        boxShadow: shadow.sm,
        padding: '20px 22px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ marginBottom: description || children || placeholder ? '16px' : 0 }}>
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: colors.textStrong }}>
          {title}
        </h3>
        {description && (
          <p style={{ margin: '6px 0 0', fontSize: '14px', color: colors.textMuted, lineHeight: 1.45 }}>
            {description}
          </p>
        )}
      </div>

      {placeholder ? (
        <div
          style={{
            padding: '32px 20px',
            textAlign: 'center',
            color: colors.textFaint,
            border: `2px dashed ${colors.disabledBg}`,
            borderRadius: radius.md,
            fontSize: '14px',
          }}
        >
          {placeholder}
        </div>
      ) : (
        children
      )}
    </section>
  );
}

export default StatsSection;
