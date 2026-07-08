import FrequentWordsSection from '../components/stats/FrequentWordsSection';
import LanguageStatsSection from '../components/stats/LanguageStatsSection';
import SpeakerStatsSection from '../components/stats/SpeakerStatsSection';
import StatsSection from '../components/stats/StatsSection';
import { colors, radius, MOBILE_BREAKPOINT } from '../theme';
import { useMediaQuery } from '../hooks/useMediaQuery';

function StatisticsPanel() {
  const isNarrow = useMediaQuery(MOBILE_BREAKPOINT);

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        border: `1px solid ${colors.border}`,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: isNarrow ? '16px' : '20px 24px', borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: isNarrow ? '22px' : '28px', fontWeight: 'bold', color: colors.textStrong }}>
          Статистика
        </h2>
        <p style={{ margin: '8px 0 0', fontSize: '14px', color: colors.textMuted, lineHeight: 1.45 }}>
          Разделы идут последовательно: слова, языки, даты и говорящие.
        </p>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: isNarrow ? '16px' : '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxSizing: 'border-box',
        }}
      >
        <FrequentWordsSection />

        <LanguageStatsSection />

        <StatsSection
          title="Статистика по датам"
          description="Динамика записей и речи по календарным периодам."
          placeholder="Раздел в разработке"
        />

        <SpeakerStatsSection />
      </div>
    </div>
  );
}

export default StatisticsPanel;
