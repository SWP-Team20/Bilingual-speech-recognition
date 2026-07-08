import { colors, radius } from '../../theme';
import {
  formatChartLabel,
  formatChartTitle,
  getChartDisplayValue,
} from './chartDisplay';

const CHART_HEIGHT = 220;
const BAR_WIDTH = 44;
const COLUMN_GAP = 14;
const MIN_CHART_WIDTH = 320;

const LANG_STYLES = {
  ru: {
    bar: 'linear-gradient(180deg, #7eb6ff 0%, #4f8fd9 100%)',
    soft: '#eef5ff',
    label: 'Русский',
  },
  tt: {
    bar: 'linear-gradient(180deg, #6ee7a8 0%, #22c55e 100%)',
    soft: colors.primarySoft,
    label: 'Татарский',
  },
  unknown: {
    bar: 'linear-gradient(180deg, #e5e7eb 0%, #b8bec8 100%)',
    soft: colors.page,
    label: 'Другие',
  },
};

function VerticalBarChart({ items = [], displayMode = 'count', total = 0 }) {
  if (!items.length) {
    return (
      <div style={{ padding: '36px 16px', textAlign: 'center', color: colors.textFaint, fontSize: '14px' }}>
        Нет данных для отображения
      </div>
    );
  }

  const maxValue = Math.max(
    ...items.map((item) => getChartDisplayValue(item.count, displayMode, total)),
    displayMode === 'percent' ? 0.1 : 1,
  );
  const chartInnerWidth = Math.max(MIN_CHART_WIDTH, items.length * (BAR_WIDTH + COLUMN_GAP) + 24);

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '14px', fontSize: '13px', color: colors.textMuted }}>
        {Object.entries(LANG_STYLES)
          .filter(([lang]) => items.some((item) => item.language === lang))
          .map(([lang, style]) => (
            <span key={lang} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '3px',
                  background: style.bar,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                }}
              />
              {style.label}
            </span>
          ))}
      </div>

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
              const displayValue = getChartDisplayValue(item.count, displayMode, total);
              const heightPct = Math.max(6, Math.round((displayValue / maxValue) * 100));
              const langStyle = LANG_STYLES[item.language] || LANG_STYLES.unknown;

              return (
                <div
                  key={`${item.text}-${item.language}-${index}`}
                  title={formatChartTitle(`${item.text} · ${langStyle.label}`, item.count, displayMode, total)}
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
                    {formatChartLabel(item.count, displayMode, total)}
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
                        background: langStyle.bar,
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
                    {item.text}
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

export default VerticalBarChart;
