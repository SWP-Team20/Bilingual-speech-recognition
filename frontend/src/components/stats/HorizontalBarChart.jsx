import { useState } from 'react';
import Modal from '../ui/Modal';
import { colors, radius, shadow } from '../../theme';
import {
  formatChartLabel,
  formatChartTitle,
  getChartDisplayValue,
} from './chartDisplay';

const PREVIEW_MAX_ROWS = 8;
const PREVIEW_ROW_HEIGHT = 48;
const EXPANDED_ROW_HEIGHT = 36;
const LABEL_WIDTH_PREVIEW = 160;
const LABEL_WIDTH_EXPANDED = 180;
const VALUE_WIDTH_PREVIEW = 72;
const VALUE_WIDTH_EXPANDED = 110;
const RANK_WIDTH_EXPANDED = 36;
const BAR_TRACK_MAX = 100;

const DEFAULT_BAR = 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)';

const LANG_STYLES = {
  ru: {
    bar: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)',
    label: 'Русский',
  },
  tt: {
    bar: 'linear-gradient(90deg, #22c55e 0%, #15803d 100%)',
    label: 'Татарский',
  },
  unknown: {
    bar: 'linear-gradient(90deg, #9ca3af 0%, #6b7280 100%)',
    label: 'Другие',
  },
};

function getItemLabel(item) {
  return item.label ?? item.text ?? '—';
}

function HorizontalBarChart({
  items = [],
  displayMode = 'count',
  total = 0,
  title = 'График',
  showLanguageLegend = false,
  toolbar = null,
}) {
  const [expanded, setExpanded] = useState(false);
  const hasItems = items.length > 0;

  const maxValue = hasItems
    ? Math.max(
      ...items.map((item) => getChartDisplayValue(item.count, displayMode, total)),
      displayMode === 'percent' ? 0.1 : 1,
    )
    : 1;

  const previewItems = items.slice(0, PREVIEW_MAX_ROWS);
  const hasMore = items.length > PREVIEW_MAX_ROWS;

  const usedLangs = showLanguageLegend && hasItems
    ? Object.entries(LANG_STYLES).filter(([lang]) => items.some((item) => item.language === lang))
    : [];

  const emptyState = (
    <div style={{ padding: '24px 16px', textAlign: 'center', color: colors.textFaint, fontSize: '14px' }}>
      Нет данных для отображения
    </div>
  );

  const renderRows = (rows, { labelWidth, valueWidth, rowHeight, compact, showRank = false, startIndex = 0 }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '12px' : '4px' }}>
      {rows.map((item, index) => {
        const displayValue = getChartDisplayValue(item.count, displayMode, total);
        const widthPct = Math.max(3, Math.round((displayValue / maxValue) * BAR_TRACK_MAX));
        const label = getItemLabel(item);
        const langStyle = showLanguageLegend
          ? (LANG_STYLES[item.language] || LANG_STYLES.unknown)
          : null;
        const barBg = langStyle?.bar || DEFAULT_BAR;
        const rank = startIndex + index + 1;

        return (
          <div
            key={`${label}-${item.language ?? item.speaker_id ?? 'x'}-${index}`}
            title={formatChartTitle(
              showLanguageLegend && langStyle ? `${label} · ${langStyle.label}` : label,
              item.count,
              displayMode,
              total,
            )}
            style={{
              display: 'grid',
              gridTemplateColumns: showRank
                ? `${RANK_WIDTH_EXPANDED}px ${labelWidth}px minmax(0, 1fr) ${valueWidth}px`
                : `${labelWidth}px minmax(0, 1fr) ${valueWidth}px`,
              alignItems: 'center',
              gap: compact ? '12px' : '10px',
              minHeight: `${rowHeight}px`,
              padding: compact ? 0 : '4px 8px',
            }}
          >
            {showRank && (
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: colors.textMuted,
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {rank}
              </div>
            )}

            <div
              style={{
                fontSize: compact ? '15px' : '14px',
                fontWeight: 600,
                color: colors.textStrong,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textAlign: 'right',
                paddingRight: '2px',
                lineHeight: 1.3,
              }}
            >
              {label}
            </div>

            <div
              style={{
                height: compact ? '26px' : '20px',
                backgroundColor: '#e5e7eb',
                borderRadius: radius.sm,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: `${widthPct}%`,
                  height: '100%',
                  background: barBg,
                  borderRadius: radius.sm,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                  transition: 'width 0.35s ease',
                  minWidth: '6px',
                }}
              />
            </div>

            <div
              style={{
                fontSize: compact ? '15px' : '13px',
                fontWeight: 700,
                color: colors.textStrong,
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}
            >
              {formatChartLabel(item.count, displayMode, total)}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div>
      {!expanded && toolbar && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          {toolbar}
        </div>
      )}

      {usedLangs.length > 0 && (
        <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', marginBottom: '16px', fontSize: '15px', color: colors.textMuted }}>
          {usedLangs.map(([lang, style]) => (
            <span key={lang} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '3px',
                  background: style.bar,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                }}
              />
              {style.label}
            </span>
          ))}
        </div>
      )}

      <div
        style={{
          background: `linear-gradient(180deg, ${colors.surface} 0%, #fafafa 100%)`,
          borderRadius: radius.lg,
          border: `1px solid ${colors.border}`,
          padding: '18px 20px',
          boxSizing: 'border-box',
        }}
      >
        {hasItems ? renderRows(previewItems, {
          labelWidth: LABEL_WIDTH_PREVIEW,
          valueWidth: VALUE_WIDTH_PREVIEW,
          rowHeight: PREVIEW_ROW_HEIGHT,
          compact: true,
        }) : emptyState}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            marginTop: '16px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '14px', color: colors.textFaint }}>
            {hasMore
              ? `Превью: топ-${previewItems.length} из ${items.length}`
              : `Всего позиций: ${items.length}`}
          </span>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.primarySoft; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.surface; }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: radius.sm,
              border: `1px solid ${colors.borderStrong}`,
              backgroundColor: colors.surface,
              color: colors.text,
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: shadow.sm,
              transition: 'background-color 0.15s ease',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
            Открыть полностью
          </button>
        </div>
      </div>

      <Modal open={expanded} onClose={() => setExpanded(false)} maxWidth="min(1100px, 94vw)" maxHeight="88vh" closeOnBackdrop>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '10px', flexShrink: 0, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0, flex: '1 1 200px' }}>
            <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: colors.textStrong }}>
              {title}
            </h4>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: colors.textMuted }}>
              {items.length} позиций · сортировка по убыванию
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
            {toolbar}
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="Закрыть"
              style={{
                border: `1px solid ${colors.borderStrong}`,
                backgroundColor: colors.page,
                color: '#333',
                borderRadius: radius.sm,
                padding: '8px 12px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                flexShrink: 0,
              }}
            >
              Закрыть
            </button>
          </div>
        </div>

        {usedLangs.length > 0 && (
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '10px', fontSize: '13px', color: colors.textMuted, flexShrink: 0 }}>
            {usedLangs.map(([lang, style]) => (
              <span key={lang} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: style.bar }} />
                {style.label}
              </span>
            ))}
          </div>
        )}

        {hasItems && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `${RANK_WIDTH_EXPANDED}px ${LABEL_WIDTH_EXPANDED}px minmax(0, 1fr) ${VALUE_WIDTH_EXPANDED}px`,
            gap: '10px',
            padding: '0 8px 6px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: colors.textFaint,
            flexShrink: 0,
          }}
        >
          <span style={{ textAlign: 'right' }}>#</span>
          <span style={{ textAlign: 'right' }}>Метка</span>
          <span>Доля</span>
          <span style={{ textAlign: 'right' }}>{displayMode === 'percent' ? '%' : 'Кол-во'}</span>
        </div>
        )}

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            border: `1px solid ${colors.border}`,
            borderRadius: radius.md,
            backgroundColor: '#fff',
            padding: '6px 8px',
          }}
        >
          {hasItems ? renderRows(items, {
            labelWidth: LABEL_WIDTH_EXPANDED,
            valueWidth: VALUE_WIDTH_EXPANDED,
            rowHeight: EXPANDED_ROW_HEIGHT,
            compact: false,
            showRank: true,
          }) : emptyState}
        </div>
        </div>
      </Modal>
    </div>
  );
}

export default HorizontalBarChart;
