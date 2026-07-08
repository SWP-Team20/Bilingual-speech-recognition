import { useEffect, useRef, useState } from 'react';
import { audioApi } from '../../api/audioApi';
import { statsApi } from '../../api/statsApi';
import { useToast } from '../ui/toastContext';
import { Skeleton } from '../ui/Skeleton';
import { colors, radius, shadow, MOBILE_BREAKPOINT } from '../../theme';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import StatsSection from './StatsSection';
import StatsDisplayModeToggle from './StatsDisplayModeToggle';
import SpeakerBarChart from './SpeakerBarChart';

const LIMIT_MIN = 1;
const LIMIT_MAX = 500;
const LIMIT_DEFAULT = 20;

const EMPTY_FILTERS = { langs: [], dateFrom: '', dateTo: '', audioIds: [], limit: LIMIT_DEFAULT };

const LANG_OPTIONS = [
  { value: 'ru', label: 'Русский' },
  { value: 'tt', label: 'Татарский' },
  { value: 'unknown', label: 'Другие' },
];

const LANG_LABELS = Object.fromEntries(LANG_OPTIONS.map(({ value, label }) => [value, label]));

function clampLimit(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return LIMIT_DEFAULT;
  return Math.max(LIMIT_MIN, Math.min(LIMIT_MAX, Math.round(parsed)));
}

function countActiveFilters(filters) {
  let count = 0;
  if (filters.langs?.length) count += 1;
  if (filters.dateFrom) count += 1;
  if (filters.dateTo) count += 1;
  if (filters.audioIds?.length) count += 1;
  return count;
}

function formatAudioLabel(audio) {
  const date = audio.recorded_at
    ? new Date(audio.recorded_at).toLocaleDateString('ru-RU')
    : null;
  return date ? `${audio.filename} (${date})` : audio.filename;
}

function matchesAudioSearch(audio, query) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;
  return (
    formatAudioLabel(audio).toLowerCase().includes(trimmed)
    || String(audio.id).toLowerCase().includes(trimmed)
  );
}

function getVisibleAudioOptions(options, query, selectedIds) {
  if (!query.trim()) return options;

  const selectedSet = new Set(selectedIds);
  const selected = options.filter((audio) => selectedSet.has(String(audio.id)));
  const matching = options.filter((audio) => matchesAudioSearch(audio, query));
  const selectedIdSet = new Set(selected.map((audio) => String(audio.id)));

  return [
    ...selected,
    ...matching.filter((audio) => !selectedIdSet.has(String(audio.id))),
  ];
}

function SpeakerStatsSection() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [displayMode, setDisplayMode] = useState('count');
  const [audioOptions, setAudioOptions] = useState([]);
  const [audioOptionsLoading, setAudioOptionsLoading] = useState(false);
  const [audioSearchQuery, setAudioSearchQuery] = useState('');
  const filterWrapRef = useRef(null);
  const toast = useToast();
  const isNarrow = useMediaQuery(MOBILE_BREAKPOINT);

  useEffect(() => {
    loadData(filters);
  }, []);

  useEffect(() => {
    if (!filtersOpen) return;
    const onClick = (e) => {
      if (filterWrapRef.current && !filterWrapRef.current.contains(e.target)) {
        setFiltersOpen(false);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [filtersOpen]);

  const loadAudioOptions = async () => {
    if (audioOptions.length || audioOptionsLoading) return;
    setAudioOptionsLoading(true);
    try {
      const list = await audioApi.fetchAudioList({ status: 'done' });
      setAudioOptions(list);
    } catch (error) {
      console.error('Ошибка загрузки списка аудио:', error);
      toast.error('Не удалось загрузить список аудиозаписей');
    } finally {
      setAudioOptionsLoading(false);
    }
  };

  const loadData = async (activeFilters) => {
    setLoading(true);
    try {
      const result = await statsApi.fetchSpeakerWordStats(activeFilters);
      setData(result);
    } catch (error) {
      console.error('Ошибка загрузки статистики говорящих:', error);
      toast.error('Не удалось загрузить статистику говорящих');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const openFilters = () => {
    setDraftFilters(filters);
    setAudioSearchQuery('');
    setFiltersOpen((v) => !v);
    if (!filtersOpen) loadAudioOptions();
  };

  const applyFilters = () => {
    const normalized = { ...draftFilters, limit: clampLimit(draftFilters.limit) };
    setDraftFilters(normalized);
    setFilters(normalized);
    setFiltersOpen(false);
    loadData(normalized);
  };

  const resetFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setFiltersOpen(false);
    loadData(EMPTY_FILTERS);
  };

  const activeFilterCount = countActiveFilters(filters);
  const visibleAudioOptions = getVisibleAudioOptions(
    audioOptions,
    audioSearchQuery,
    draftFilters.audioIds,
  );
  const matchedAudioCount = audioSearchQuery.trim()
    ? audioOptions.filter((audio) => matchesAudioSearch(audio, audioSearchQuery)).length
    : audioOptions.length;

  const filterFieldStyle = {
    width: '100%',
    maxWidth: '100%',
    margin: 0,
    display: 'block',
    padding: '8px 10px',
    borderRadius: radius.sm,
    border: `1px solid ${colors.borderStrong}`,
    boxSizing: 'border-box',
    outline: 'none',
    fontSize: '14px',
    fontFamily: 'inherit',
    backgroundColor: colors.surface,
    color: colors.text,
    minWidth: 0,
  };

  const dateFieldStyle = {
    ...filterFieldStyle,
    padding: '8px 6px',
  };

  return (
    <StatsSection
      title="Статистика по говорящим"
      description="Количество слов, произнесённых каждым говорящим. Листайте график в сторону, если говорящих много."
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px', color: colors.textMuted, alignItems: 'center' }}>
          {data && !loading && (
            <>
              <span>Всего слов: <b style={{ color: colors.text }}>{data.total_words}</b></span>
              <span>Говорящих: <b style={{ color: colors.text }}>{data.total_speakers}</b></span>
            </>
          )}
          {filters.langs.length > 0 && (
            <span style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap' }}>
              Язык:
              {filters.langs.map((lang) => (
                <span
                  key={lang}
                  style={{
                    backgroundColor: colors.primarySoft,
                    color: colors.primaryDeep,
                    padding: '2px 8px',
                    borderRadius: radius.pill,
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {LANG_LABELS[lang] || lang}
                </span>
              ))}
            </span>
          )}
          {filters.audioIds.length > 0 && (
            <span style={{ fontSize: '12px', color: colors.textMuted }}>
              Записей: <b style={{ color: colors.text }}>{filters.audioIds.length}</b>
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
          <StatsDisplayModeToggle mode={displayMode} onChange={setDisplayMode} />

          <div ref={filterWrapRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            type="button"
            onClick={openFilters}
            aria-expanded={filtersOpen}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ececec'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = activeFilterCount > 0 ? colors.primarySoft : colors.surface; }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: activeFilterCount > 0 ? colors.primarySoft : colors.surface,
              color: colors.text,
              border: `1px solid ${activeFilterCount > 0 ? colors.primarySoftBorder : colors.borderStrong}`,
              borderRadius: radius.sm,
              padding: '8px 12px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: shadow.sm,
            }}
          >
            Фильтры
            {activeFilterCount > 0 && (
              <span style={{ minWidth: '18px', height: '18px', padding: '0 5px', borderRadius: radius.pill, backgroundColor: colors.primary, color: '#fff', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {filtersOpen && (
            <div
              role="dialog"
              aria-label="Фильтры статистики говорящих"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                zIndex: 50,
                width: isNarrow ? 'min(320px, calc(100vw - 32px))' : '320px',
                maxHeight: 'min(70vh, 520px)',
                overflowY: 'auto',
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.lg,
                boxShadow: shadow.lg,
                padding: '18px',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: colors.textMuted }}>Язык</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {LANG_OPTIONS.map(({ value, label }) => {
                    const checked = draftFilters.langs.includes(value);
                    return (
                      <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setDraftFilters((f) => ({
                              ...f,
                              langs: checked ? f.langs.filter((lang) => lang !== value) : [...f.langs, value],
                            }));
                          }}
                          style={{ width: '16px', height: '16px', accentColor: colors.primary }}
                        />
                        {label}
                      </label>
                    );
                  })}
                </div>
                <div style={{ marginTop: '6px', fontSize: '12px', color: colors.textFaint, lineHeight: 1.4 }}>
                  Если ничего не выбрано — все языки.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px', minWidth: 0 }}>
                <div style={{ minWidth: 0 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: colors.textMuted }}>Дата с</label>
                  <input type="date" value={draftFilters.dateFrom} onChange={(e) => setDraftFilters((f) => ({ ...f, dateFrom: e.target.value }))} style={dateFieldStyle} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: colors.textMuted }}>Дата по</label>
                  <input type="date" value={draftFilters.dateTo} onChange={(e) => setDraftFilters((f) => ({ ...f, dateTo: e.target.value }))} style={dateFieldStyle} />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: colors.textMuted }}>Аудиозаписи</label>
                {audioOptionsLoading ? (
                  <div style={{ fontSize: '13px', color: colors.textFaint }}>Загрузка…</div>
                ) : audioOptions.length === 0 ? (
                  <div style={{ fontSize: '13px', color: colors.textFaint }}>Нет готовых записей</div>
                ) : (
                  <>
                    <input
                      type="search"
                      value={audioSearchQuery}
                      onChange={(e) => setAudioSearchQuery(e.target.value)}
                      placeholder="Поиск по названию, дате или ID"
                      aria-label="Поиск аудиозаписей"
                      style={{ ...filterFieldStyle, marginBottom: '8px' }}
                    />
                    {audioSearchQuery.trim() && (
                      <div style={{ marginBottom: '8px', fontSize: '12px', color: colors.textFaint }}>
                        Найдено: {matchedAudioCount} из {audioOptions.length}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                      {visibleAudioOptions.length === 0 ? (
                        <div style={{ fontSize: '13px', color: colors.textFaint, padding: '4px 0' }}>
                          Ничего не найдено
                        </div>
                      ) : (
                        visibleAudioOptions.map((audio) => {
                          const audioId = String(audio.id);
                          const checked = draftFilters.audioIds.includes(audioId);
                          return (
                            <label key={audioId} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', cursor: 'pointer', lineHeight: 1.35 }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  setDraftFilters((f) => ({
                                    ...f,
                                    audioIds: checked
                                      ? f.audioIds.filter((id) => id !== audioId)
                                      : [...f.audioIds, audioId],
                                  }));
                                }}
                                style={{ width: '16px', height: '16px', marginTop: '2px', flexShrink: 0, accentColor: colors.primary }}
                              />
                              <span style={{ wordBreak: 'break-word' }}>{formatAudioLabel(audio)}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
                <div style={{ marginTop: '6px', fontSize: '12px', color: colors.textFaint, lineHeight: 1.4 }}>
                  Если ничего не выбрано — все записи. Выбранные записи остаются в списке при поиске.
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: colors.textMuted }}>Количество говорящих на графике</label>
                <input
                  type="number"
                  min={LIMIT_MIN}
                  max={LIMIT_MAX}
                  value={draftFilters.limit}
                  onChange={(e) => setDraftFilters((f) => ({ ...f, limit: e.target.value }))}
                  onBlur={(e) => setDraftFilters((f) => ({ ...f, limit: clampLimit(e.target.value) }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }}
                  style={filterFieldStyle}
                />
                <div style={{ marginTop: '6px', fontSize: '12px', color: colors.textFaint }}>
                  От {LIMIT_MIN} до {LIMIT_MAX}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={resetFilters} style={{ backgroundColor: colors.page, color: '#333', border: `1px solid ${colors.borderStrong}`, padding: '8px 14px', borderRadius: radius.sm, fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                  Сбросить
                </button>
                <button type="button" onClick={applyFilters} style={{ backgroundColor: colors.primary, color: '#fff', border: 'none', padding: '8px 14px', borderRadius: radius.sm, fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>
                  Применить
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', gap: '12px', overflow: 'hidden', padding: '12px 0' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '44px', flexShrink: 0 }}>
              <Skeleton height="14px" width="24px" style={{ marginBottom: '8px' }} />
              <Skeleton height={`${80 + (i % 4) * 28}px`} width="44px" />
              <Skeleton height="12px" width="36px" style={{ marginTop: '10px' }} />
            </div>
          ))}
        </div>
      ) : (
        <SpeakerBarChart
          items={data?.items || []}
          displayMode={displayMode}
          total={data?.total_words ?? 0}
        />
      )}
    </StatsSection>
  );
}

export default SpeakerStatsSection;
