import { useEffect, useMemo, useRef, useState } from 'react';
import { audioApi } from '../api/audioApi';
import { speakersApi } from '../api/speakersApi';
import { useToast } from '../components/ui/toastContext';
import { Skeleton } from '../components/ui/Skeleton';
import { colors, radius, shadow, MOBILE_BREAKPOINT } from '../theme';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { formatRecordingDate } from '../utils/recordingDate';

const EMPTY_FILTERS = { dateFrom: '', dateTo: '', audioIds: [] };

const LANG_COLORS = {
  ru: '#1976d2',
  tt: '#009a55',
  unknown: '#888',
};

function countActiveFilters(filters) {
  let count = 0;
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

function groupWordsByAudio(items) {
  const groups = [];
  const map = new Map();
  items.forEach((item) => {
    const key = String(item.audio_id);
    if (!map.has(key)) {
      const group = {
        audioId: item.audio_id,
        filename: item.audio_filename,
        recordedAt: item.recorded_at,
        words: [],
      };
      map.set(key, group);
      groups.push(group);
    }
    map.get(key).words.push(item);
  });
  return groups;
}

function SpeakersPanel({ onNavigateToWord }) {
  const toast = useToast();
  const isNarrow = useMediaQuery(MOBILE_BREAKPOINT);
  const filterWrapRef = useRef(null);

  const [speakers, setSpeakers] = useState([]);
  const [speakersLoading, setSpeakersLoading] = useState(true);
  const [selectedSpeakerId, setSelectedSpeakerId] = useState(null);

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [wordData, setWordData] = useState(null);
  const [wordsLoading, setWordsLoading] = useState(false);

  const [audioOptions, setAudioOptions] = useState([]);
  const [audioOptionsLoading, setAudioOptionsLoading] = useState(false);
  const [audioSearchQuery, setAudioSearchQuery] = useState('');

  const selectedSpeaker = speakers.find((s) => s.id === selectedSpeakerId) || null;
  const groupedWords = useMemo(
    () => groupWordsByAudio(wordData?.items || []),
    [wordData],
  );

  const filterFieldStyle = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: radius.sm,
    border: `1px solid ${colors.borderStrong}`,
    boxSizing: 'border-box',
    fontSize: '14px',
    fontFamily: 'inherit',
    backgroundColor: colors.surface,
    color: colors.text,
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSpeakersLoading(true);
      try {
        try {
          await speakersApi.reconcileLabels();
        } catch (reconcileError) {
          console.warn('Speaker label sync skipped:', reconcileError);
        }
        const list = await speakersApi.listSpeakers();
        if (cancelled) return;
        setSpeakers(list);
        if (list.length && !selectedSpeakerId) {
          setSelectedSpeakerId(list[0].id);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) toast.error('Не удалось загрузить список говорящих');
      } finally {
        if (!cancelled) setSpeakersLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedSpeakerId) {
      setWordData(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setWordsLoading(true);
      try {
        const result = await speakersApi.fetchSpeakerWords(selectedSpeakerId, filters);
        if (!cancelled) setWordData(result);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          toast.error('Не удалось загрузить слова говорящего');
          setWordData(null);
        }
      } finally {
        if (!cancelled) setWordsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedSpeakerId, filters]);

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
      console.error(error);
      toast.error('Не удалось загрузить список аудиозаписей');
    } finally {
      setAudioOptionsLoading(false);
    }
  };

  const openFilters = () => {
    setDraftFilters(filters);
    setAudioSearchQuery('');
    setFiltersOpen((v) => !v);
    if (!filtersOpen) loadAudioOptions();
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setFiltersOpen(false);
  };

  const handleWordClick = (item) => {
    onNavigateToWord?.({
      audioId: item.audio_id,
      startSec: item.start_sec,
      position: item.position,
    });
  };

  const activeFilterCount = countActiveFilters(filters);
  const visibleAudioOptions = audioSearchQuery.trim()
    ? audioOptions.filter((audio) => matchesAudioSearch(audio, audioSearchQuery))
    : audioOptions;

  return (
    <div style={{
      flex: 1,
      minHeight: 0,
      display: 'grid',
      gridTemplateColumns: isNarrow ? '1fr' : 'minmax(220px, 280px) 1fr',
      gap: isNarrow ? '20px' : '32px',
      overflow: isNarrow ? 'visible' : 'hidden',
    }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.md,
        overflow: 'hidden',
      }}
      >
        <div style={{ padding: '16px 18px', borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: isNarrow ? '20px' : '22px', textAlign: 'left' }}>Говорящие</h2>
        </div>
        <div className={isNarrow ? undefined : 'panel-scroll panel-scroll--right'} style={{ flex: 1, minHeight: isNarrow ? undefined : 0 }}>
          <div className={isNarrow ? undefined : 'panel-scroll__content'} style={{ padding: '12px' }}>
            {speakersLoading ? (
              <>
                <Skeleton height={52} />
                <Skeleton height={52} />
                <Skeleton height={52} />
              </>
            ) : speakers.length === 0 ? (
              <div style={{ padding: '24px 12px', color: colors.textFaint, textAlign: 'center', fontSize: '14px' }}>
                Пока нет говорящих с привязанными словами
              </div>
            ) : (
              speakers.map((speaker) => {
                const active = speaker.id === selectedSpeakerId;
                return (
                  <button
                    key={speaker.id}
                    type="button"
                    onClick={() => setSelectedSpeakerId(speaker.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      padding: '12px 14px',
                      marginBottom: '8px',
                      border: `1px solid ${active ? colors.primarySoftBorder : colors.border}`,
                      borderRadius: radius.sm,
                      backgroundColor: active ? colors.primarySoft : colors.page,
                      color: colors.text,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                    }}
                  >
                    <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {speaker.label}
                    </span>
                    <span style={{
                      flexShrink: 0,
                      fontSize: '12px',
                      fontWeight: 600,
                      color: colors.primary,
                      backgroundColor: colors.surface,
                      padding: '2px 8px',
                      borderRadius: radius.pill,
                    }}
                    >
                      {speaker.audio_count}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.md,
        overflow: 'hidden',
      }}
      >
        <div style={{
          padding: '16px 18px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          flexShrink: 0,
        }}
        >
          <div style={{ textAlign: 'left', minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: isNarrow ? '20px' : '22px' }}>
              {selectedSpeaker ? `Слова: ${selectedSpeaker.label}` : 'Слова говорящего'}
            </h2>
            {wordData && (
              <div style={{ marginTop: '4px', fontSize: '13px', color: colors.textMuted }}>
                Всего слов: {wordData.total}
                {wordData.total > wordData.items.length ? ` · показано ${wordData.items.length}` : ''}
              </div>
            )}
          </div>

          <div ref={filterWrapRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              type="button"
              onClick={openFilters}
              aria-expanded={filtersOpen}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: activeFilterCount > 0 ? colors.primarySoft : colors.page,
                color: colors.text,
                border: `1px solid ${activeFilterCount > 0 ? colors.primarySoftBorder : colors.borderStrong}`,
                borderRadius: radius.sm,
                padding: '9px 14px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: shadow.sm,
              }}
            >
              Фильтры
              {activeFilterCount > 0 && (
                <span style={{
                  minWidth: '18px',
                  height: '18px',
                  borderRadius: radius.pill,
                  backgroundColor: colors.primary,
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>

            {filtersOpen && (
              <div
                role="dialog"
                aria-label="Фильтры слов говорящего"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  zIndex: 50,
                  width: isNarrow ? 'min(320px, calc(100vw - 32px))' : '320px',
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.lg,
                  boxShadow: shadow.lg,
                  padding: '18px',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: colors.textMuted }}>Дата с</label>
                    <input type="date" value={draftFilters.dateFrom} onChange={(e) => setDraftFilters((f) => ({ ...f, dateFrom: e.target.value }))} style={filterFieldStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: colors.textMuted }}>Дата по</label>
                    <input type="date" value={draftFilters.dateTo} onChange={(e) => setDraftFilters((f) => ({ ...f, dateTo: e.target.value }))} style={filterFieldStyle} />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: colors.textMuted }}>Аудиозаписи</label>
                  <input
                    type="search"
                    value={audioSearchQuery}
                    onChange={(e) => setAudioSearchQuery(e.target.value)}
                    placeholder="Поиск по названию"
                    style={{ ...filterFieldStyle, marginBottom: '8px' }}
                  />
                  <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {audioOptionsLoading ? (
                      <Skeleton height={36} />
                    ) : visibleAudioOptions.length === 0 ? (
                      <div style={{ fontSize: '13px', color: colors.textFaint }}>Нет записей</div>
                    ) : (
                      visibleAudioOptions.map((audio) => {
                        const id = String(audio.id);
                        const checked = draftFilters.audioIds.includes(id);
                        return (
                          <label key={id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setDraftFilters((f) => ({
                                  ...f,
                                  audioIds: checked
                                    ? f.audioIds.filter((x) => x !== id)
                                    : [...f.audioIds, id],
                                }));
                              }}
                              style={{ marginTop: '3px' }}
                            />
                            <span>{formatAudioLabel(audio)}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={resetFilters} style={{ padding: '8px 14px', borderRadius: radius.sm, border: `1px solid ${colors.borderStrong}`, backgroundColor: colors.page, cursor: 'pointer' }}>Сбросить</button>
                  <button type="button" onClick={applyFilters} style={{ padding: '8px 14px', borderRadius: radius.sm, border: 'none', backgroundColor: colors.primary, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Применить</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={isNarrow ? undefined : 'panel-scroll panel-scroll--right'} style={{ flex: 1, minHeight: isNarrow ? undefined : 0 }}>
          <div className={isNarrow ? undefined : 'panel-scroll__content'} style={{ padding: '16px 18px' }}>
            {!selectedSpeakerId ? (
              <div style={{ color: colors.textFaint, textAlign: 'center', padding: '40px 16px' }}>
                Выберите говорящего слева
              </div>
            ) : wordsLoading ? (
              <>
                <Skeleton height={80} />
                <Skeleton height={80} />
              </>
            ) : groupedWords.length === 0 ? (
              <div style={{ color: colors.textFaint, textAlign: 'center', padding: '40px 16px' }}>
                Нет слов по выбранным фильтрам
              </div>
            ) : (
              groupedWords.map((group) => (
                <div key={group.audioId} style={{ marginBottom: '24px' }}>
                  <div style={{
                    marginBottom: '10px',
                    paddingBottom: '8px',
                    borderBottom: `1px dashed ${colors.border}`,
                    textAlign: 'left',
                  }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '15px', color: colors.text }}>{group.filename}</div>
                    {group.recordedAt && (
                      <div style={{ fontSize: '13px', color: colors.textMuted, marginTop: '2px' }}>
                        {formatRecordingDate(group.recordedAt)}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {group.words.map((item) => (
                      <button
                        key={`${item.audio_id}-${item.position}`}
                        type="button"
                        title={`Перейти к записи (${formatTime(item.start_sec)})`}
                        onClick={() => handleWordClick(item)}
                        style={{
                          border: `1px solid ${colors.border}`,
                          borderLeft: `3px solid ${LANG_COLORS[item.language] || LANG_COLORS.unknown}`,
                          backgroundColor: colors.page,
                          borderRadius: radius.sm,
                          padding: '6px 10px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          color: colors.text,
                        }}
                      >
                        {item.raw || item.text}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default SpeakersPanel;
