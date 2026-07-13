import FrequentWordsSection from '../components/stats/FrequentWordsSection';
import LanguageStatsSection from '../components/stats/LanguageStatsSection';
import DateStatsSection from '../components/stats/DateStatsSection';
import SpeakerStatsSection from '../components/stats/SpeakerStatsSection';
import StatsDownloadButton from '../components/stats/StatsDownloadButton';
import { StatsFiltersProvider, useAllStatsFilters } from '../components/stats/statsFiltersContext';
import { statsApi } from '../api/statsApi';
import { useToast } from '../components/ui/toastContext';
import { colors, radius, MOBILE_BREAKPOINT } from '../theme';
import { useMediaQuery } from '../hooks/useMediaQuery';

function StatisticsPanelContent() {
  const isNarrow = useMediaQuery(MOBILE_BREAKPOINT);
  const toast = useToast();
  const categoryFilters = useAllStatsFilters();

  const handleExportAll = async (format) => {
    try {
      await statsApi.downloadAllStatsExport(format, categoryFilters);
    } catch (error) {
      console.error('Ошибка экспорта всей статистики:', error);
      toast.error('Не удалось экспортировать всю статистику');
    }
  };

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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: colors.textStrong }}>
              Статистика
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: '14px', color: colors.textMuted, lineHeight: 1.45 }}>
              Экспорт всего отчёта учитывает фильтры каждой категории.
            </p>
          </div>
          <StatsDownloadButton
            label="Экспорт всего"
            loadingLabel="Экспорт всего…"
            ariaLabel="Экспорт всей статистики"
            onDownload={handleExportAll}
          />
        </div>

        <FrequentWordsSection />

        <LanguageStatsSection />

        <DateStatsSection />

        <SpeakerStatsSection />
      </div>
    </div>
  );
}

function StatisticsPanel() {
  return (
    <StatsFiltersProvider>
      <StatisticsPanelContent />
    </StatsFiltersProvider>
  );
}

export default StatisticsPanel;
