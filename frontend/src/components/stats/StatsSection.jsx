import { colors, radius, shadow, MOBILE_BREAKPOINT } from '../../theme';
import { useMediaQuery } from '../../hooks/useMediaQuery';

function StatsSection({ title, description, children, placeholder, headerAction }) {
  const isNarrow = useMediaQuery(MOBILE_BREAKPOINT);
  const hasHeaderAction = Boolean(headerAction);

  const headerBlock = (
    <>
      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: colors.textStrong }}>
        {title}
      </h3>
      {description && (
        <p style={{ margin: '6px 0 0', fontSize: '14px', color: colors.textMuted, lineHeight: 1.45 }}>
          {description}
        </p>
      )}
    </>
  );

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
      {hasHeaderAction ? (
        <div style={{
          position: 'relative',
          marginBottom: description || children || placeholder ? '16px' : 0,
          display: 'flex',
          flexDirection: isNarrow ? 'column' : 'row',
          alignItems: isNarrow ? 'stretch' : 'center',
          gap: isNarrow ? '12px' : '0',
        }}
        >
          <div style={{
            flex: 1,
            textAlign: 'center',
            padding: isNarrow ? 0 : '0 190px',
            minWidth: 0,
          }}
          >
            {headerBlock}
          </div>
          <div style={{
            position: isNarrow ? 'static' : 'absolute',
            right: 0,
            top: isNarrow ? undefined : '50%',
            transform: isNarrow ? undefined : 'translateY(-50%)',
            flexShrink: 0,
            alignSelf: isNarrow ? 'flex-end' : undefined,
          }}
          >
            {headerAction}
          </div>
        </div>
      ) : (
        <div style={{
          marginBottom: description || children || placeholder ? '16px' : 0,
        }}
        >
          {headerBlock}
        </div>
      )}

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
