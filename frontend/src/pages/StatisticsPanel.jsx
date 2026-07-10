import FrequentWordsSection from '../components/stats/FrequentWordsSection';
import LanguageStatsSection from '../components/stats/LanguageStatsSection';
import DateStatsSection from '../components/stats/DateStatsSection';
import SpeakerStatsSection from '../components/stats/SpeakerStatsSection';
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

        <DateStatsSection />

        <SpeakerStatsSection />
      </div>
    </div>
  );
}

export default StatisticsPanel;
