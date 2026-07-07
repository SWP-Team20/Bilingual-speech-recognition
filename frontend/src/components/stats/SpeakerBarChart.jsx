import { colors, radius } from '../../theme';

const CHART_HEIGHT = 220;
const BAR_WIDTH = 44;
const COLUMN_GAP = 14;
const MIN_CHART_WIDTH = 320;

const BAR_GRADIENT = 'linear-gradient(180deg, #7eb6ff 0%, #4f8fd9 100%)';

function SpeakerBarChart({ items = [] }) {
  if (!items.length) {
    return (
      <div style={{ padding: '36px 16px', textAlign: 'center', color: colors.textFaint, fontSize: '14px' }}>
        Нет данных для отображения
      </div>
    );
  }

  const maxCount = Math.max(...items.map((item) => item.count), 1);
  const chartInnerWidth = Math.max(MIN_CHART_WIDTH, items.length * (BAR_WIDTH + COLUMN_GAP) + 24);

  return (
    <div>
      <div
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          paddingBottom: '6px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div
          style={{
            position: 'relative',
            minWidth: `${chartInnerWidth}px`,
            height: `${CHART_HEIGHT + 72}px`,
            padding: '8px 12px 0',
            boxSizing: 'border-box',
            background: `linear-gradient(180deg, ${colors.surface} 0%, #fafafa 100%)`,
            borderRadius: radius.lg,
            border: `1px solid ${colors.border}`,
          }}
        >
          {[0.25, 0.5, 0.75, 1].map((tick) => (
            <div
              key={tick}
              style={{
                position: 'absolute',
                left: '12px',
                right: '12px',
                bottom: `${56 + tick * CHART_HEIGHT}px`,
                borderTop: `1px dashed ${colors.divider}`,
                pointerEvents: 'none',
              }}
            />
          ))}

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: `${COLUMN_GAP}px`,
              height: `${CHART_HEIGHT + 56}px`,
              paddingTop: '28px',
              boxSizing: 'border-box',
            }}
          >
            {items.map((item, index) => {
              const heightPct = Math.max(6, Math.round((item.count / maxCount) * 100));

              return (
                <div
                  key={`${item.speaker_id ?? 'none'}-${item.label}-${index}`}
                  title={`${item.label} · ${item.count} слов`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: `${BAR_WIDTH}px`,
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: colors.textMuted,
                      marginBottom: '8px',
                      lineHeight: 1,
                    }}
                  >
                    {item.count}
                  </span>

                  <div
                    style={{
                      width: '100%',
                      height: `${CHART_HEIGHT}px`,
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: `${heightPct}%`,
                        background: BAR_GRADIENT,
                        borderRadius: `${radius.sm} ${radius.sm} 4px 4px`,
                        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)',
                        transition: 'height 0.4s ease',
                        minHeight: '8px',
                      }}
                    />
                  </div>

                  <div
                    style={{
                      marginTop: '10px',
                      width: '100%',
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: colors.text,
                      lineHeight: 1.25,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      wordBreak: 'break-word',
                      minHeight: '30px',
                    }}
                  >
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '8px', fontSize: '12px', color: colors.textFaint, textAlign: 'right' }}>
        Листайте график горизонтально →
      </div>
    </div>
  );
}

export default SpeakerBarChart;
