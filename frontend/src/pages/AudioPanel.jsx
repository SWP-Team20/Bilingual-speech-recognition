import { useState, useEffect, useRef } from 'react';
import { audioApi } from '../api/audioApi';
import AudioPlayer from '../components/AudioPlayer';
import TranscriptionBox from '../components/TranscriptionBox';
import AudioMetadataEditModal from '../components/AudioMetadataEditModal';
import { AudioRowSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/toastContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { colors, radius, shadow, MOBILE_BREAKPOINT } from '../theme';
import { isTerminal } from '../constants/status';
import { canManageCorpus } from '../constants/roleTranslations';
import SpeakerFilterSelect from '../components/stats/SpeakerFilterSelect';
import SelectDropdown from '../components/SelectDropdown';

const EMPTY_FILTERS = { words: '', langs: [], speakers: [], status: '', dateFrom: '', dateTo: '' };

const LANG_FILTER_OPTIONS = [
  { value: 'ru', label: 'Русский' },
  { value: 'tt', label: 'Татарский' },
  { value: 'unknown', label: 'Другой' },
];

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Любой статус' },
  { value: 'done', label: 'Обработано' },
  { value: 'processing_text', label: 'В обработке' },
  { value: 'error', label: 'Ошибка' },
];

function countActiveFilters(filters) {
  let count = 0;
  if (filters.words?.trim()) count += 1;
  if (filters.langs?.length) count += 1;
  if (filters.speakers?.length) count += 1;
  if (filters.status) count += 1;
  if (filters.dateFrom) count += 1;
  if (filters.dateTo) count += 1;
  return count;
}

function AudioPanel({
  userRole,
  pendingUploads,
  uploadVersion,
  searchQuery = '',
  focusAudio = null,
  onFocusAudioHandled,
}) {
  const [audioList, setAudioList] = useState([]);
  const [selectedAudioId, setSelectedAudioId] = useState(null);
  const [selectedTranscription, setSelectedTranscription] = useState('');
  const [selectedTranscriptionWords, setSelectedTranscriptionWords] = useState([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [totalStorageMb, setTotalStorageMb] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [metadataEditOpen, setMetadataEditOpen] = useState(false);
  const [seekTarget, setSeekTarget] = useState(null);
  const [navHighlight, setNavHighlight] = useState(null);

  // Filters: `filters` is what's applied to the list, `draftFilters` is the
  // in-progress state of the open filter panel.
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef(filters);
  const searchQueryRef = useRef(searchQuery);
  const loadRequestIdRef = useRef(0);
  const filterWrapRef = useRef(null);

  const toast = useToast();
  const isNarrow = useMediaQuery(MOBILE_BREAKPOINT);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  useEffect(() => {
    loadAudioList();
  }, [searchQuery]);

  useEffect(() => {
    if (uploadVersion > 0) loadAudioList();
  }, [uploadVersion]);

  // Open a specific audio when navigating from search or the speakers tab.
  useEffect(() => {
    if (!focusAudio?.audioId) return;
    let cancelled = false;
    const { audioId, startSec, position } = focusAudio;
    setNavHighlight({
      audioId,
      wordPosition: Number.isInteger(position) ? position : null,
    });
    if (startSec != null && Number.isFinite(startSec)) {
      setSeekTarget({ audioId, startSec });
    }
    (async () => {
      setMetadataEditOpen(false);
      setSelectedAudioId(audioId);
      setIsTranscribing(true);
      try {
        const data = await audioApi.fetchTranscription(audioId);
        if (cancelled) return;
        setSelectedTranscription(data.transcription_text || 'Транскрипция не найдена.');
        setSelectedTranscriptionWords(data.words || []);
      } catch (error) {
        if (cancelled) return;
        console.error(error);
        setSelectedTranscription('Ошибка загрузки транскрипции');
        setSelectedTranscriptionWords([]);
        toast.error('Не удалось загрузить транскрипцию');
      } finally {
        if (!cancelled) {
          setIsTranscribing(false);
          onFocusAudioHandled?.();
        }
      }
    })();
    return () => { cancelled = true; };
  }, [focusAudio]);

  useEffect(() => {
    if (!seekTarget) return undefined;
    const timer = setTimeout(() => setSeekTarget(null), 1500);
    return () => clearTimeout(timer);
  }, [seekTarget]);

  // Close the filter panel when clicking outside of it.
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

  // Consolidated status polling: one timer for the whole list, only while
  // something is still being processed. Replaces per-row polling.
  // Reads search/filters via refs so the interval never applies a stale query.
  const hasProcessing = audioList.some((a) => !isTerminal(a.status));
  useEffect(() => {
    if (!hasProcessing) return;
    const interval = setInterval(() => {
      loadAudioList({ silent: true });
    }, 3000);
    return () => clearInterval(interval);
  }, [hasProcessing]);

  const loadAudioList = async ({ silent = false, filters: filtersArg } = {}) => {
    const activeFilters = filtersArg ?? filtersRef.current;
    const query = searchQueryRef.current;
    const requestId = ++loadRequestIdRef.current;
    try {
      const data = query
        ? await audioApi.searchByFilename(query)
        : await audioApi.fetchAudioList(activeFilters);
      // Ignore outdated responses (e.g. a poll that started before a search).
      if (requestId !== loadRequestIdRef.current) return;
      setAudioList(data);
    } catch (error) {
      if (requestId !== loadRequestIdRef.current) return;
      console.error("Ошибка загрузки аудио:", error);
      if (!silent) toast.error('Не удалось загрузить список аудиозаписей');
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setIsInitialLoading(false);
      }
    }
    loadTotalStorage();
  };

  const activeFilterCount = countActiveFilters(filters);

  const openFilters = () => {
    setDraftFilters(filters);
    setFiltersOpen((v) => !v);
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    setFiltersOpen(false);
    loadAudioList({ filters: draftFilters });
  };

  const resetFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setFiltersOpen(false);
    loadAudioList({ filters: EMPTY_FILTERS });
  };

  const filterFieldStyle = {
    width: '100%',
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
  };

  const loadTotalStorage = async () => {
    try {
      const data = await audioApi.fetchTotalStorage();
      setTotalStorageMb(data.total_allocated_mb);
    } catch (error) {
      console.error("Ошибка загрузки общего размера хранилища:", error);
    }
  };

  const handleDeleteSuccess = (audio, undoMeta) => {
    const wasSelected = selectedAudioId === audio?.id;
    if (wasSelected) {
      setSelectedAudioId(null);
      setSelectedTranscription('');
      setSelectedTranscriptionWords([]);
      setMetadataEditOpen(false);
    }
    loadAudioList();

    const undoSeconds = undoMeta?.undo_seconds ?? 60;
    const title = audio?.filename || 'Аудиозапись';
    toast.undo(`«${title}» удалена`, {
      seconds: undoSeconds,
      onUndo: async () => {
        try {
          await audioApi.restoreAudio(audio.id);
          loadAudioList();
          if (wasSelected) {
            setSelectedAudioId(audio.id);
            handleTranscribeClick(audio.id);
          }
          toast.success('Аудиозапись восстановлена');
        } catch (error) {
          console.error(error);
          const status = error?.response?.status;
          toast.error(
            status === 410
              ? 'Время для отмены удаления истекло'
              : 'Не удалось восстановить аудиозапись',
          );
        }
      },
    });
  };

  const handleMetadataUpdated = () => {
    loadAudioList();
  };

  const handleTranscribeClick = async (audioId) => {
    setMetadataEditOpen(false);
    if (selectedAudioId === audioId) {
      setSelectedAudioId(null);
      setSelectedTranscription('');
      setSelectedTranscriptionWords([]);
    } else {
      setSelectedAudioId(audioId);
      setIsTranscribing(true);
      try {
        const data = await audioApi.fetchTranscription(audioId);
        setSelectedTranscription(data.transcription_text || 'Транскрипция не найдена.');
        setSelectedTranscriptionWords(data.words || []);
      } catch (error) {
        console.error(error);
        setSelectedTranscription('Ошибка загрузки транскрипции');
        setSelectedTranscriptionWords([]);
        toast.error('Не удалось загрузить транскрипцию');
      } finally {
        setIsTranscribing(false);
      }
    }
  };

  const selectedAudio = audioList.find(a => a.id === selectedAudioId);
  const currentAudioName = selectedAudio ? selectedAudio.filename : '';
  const combinedAudioList = [...pendingUploads, ...audioList];
  const isEmpty = !isInitialLoading && combinedAudioList.length === 0;
  const showTranscriptionColumn = !isNarrow || selectedAudioId;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: isNarrow ? '28px' : '48px', height: isNarrow ? 'auto' : '100%', minHeight: 0, flex: isNarrow ? undefined : 1, overflow: isNarrow ? 'visible' : 'hidden' }}>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: isNarrow ? 'auto' : '100%', alignItems: 'stretch', order: isNarrow ? 2 : undefined }}>
        <div style={{ marginBottom: '20px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: isNarrow ? 'flex-start' : 'center', gap: '12px', flexShrink: 0, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: isNarrow ? '22px' : '28px', fontWeight: 'bold', margin: 0, padding: 0, textAlign: 'left', lineHeight: 1 }}>Аудиозаписи</h2>
            {totalStorageMb !== null && (
              <span style={{ fontSize: '14px', fontWeight: '500', lineHeight: 1, color: colors.primary, backgroundColor: colors.primarySoft, padding: '4px 10px', borderRadius: radius.lg, whiteSpace: 'nowrap', transform: 'translateY(3px)' }}>
                Всего: {totalStorageMb} МБ
              </span>
            )}
          </div>

          <div ref={filterWrapRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              type="button"
              onClick={openFilters}
              aria-expanded={filtersOpen}
              aria-haspopup="dialog"
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ececec'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = activeFilterCount > 0 ? colors.primarySoft : colors.surface; }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                backgroundColor: activeFilterCount > 0 ? colors.primarySoft : colors.surface,
                color: colors.text, border: `1px solid ${activeFilterCount > 0 ? colors.primarySoftBorder : colors.borderStrong}`,
                borderRadius: radius.sm, padding: '9px 14px', fontSize: '15px', fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: shadow.sm,
                transition: 'background-color 0.15s ease',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
              <span>Фильтры</span>
              {activeFilterCount > 0 && (
                <span style={{ minWidth: '18px', height: '18px', padding: '0 5px', boxSizing: 'border-box', borderRadius: radius.pill, backgroundColor: colors.primary, color: '#fff', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {activeFilterCount}
                </span>
              )}
            </button>

            {filtersOpen && (
              <div
                role="dialog"
                aria-label="Фильтры аудиозаписей"
                style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50,
                  width: isNarrow ? 'min(300px, calc(100vw - 32px))' : '300px',
                  maxWidth: isNarrow ? 'calc(100vw - 32px)' : 'calc(100vw - 48px)',
                  backgroundColor: colors.surface, border: `1px solid ${colors.border}`,
                  borderRadius: radius.lg, boxShadow: shadow.lg, padding: '18px',
                  boxSizing: 'border-box', textAlign: 'left',
                }}
              >
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: colors.textMuted }}>Слова в транскрипции</label>
                  <input
                    type="text"
                    value={draftFilters.words}
                    placeholder="Например: привет, җиңү"
                    onChange={(e) => setDraftFilters((f) => ({ ...f, words: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }}
                    style={filterFieldStyle}
                  />
                  <div style={{ marginTop: '6px', fontSize: '12px', color: colors.textFaint, lineHeight: 1.4 }}>
                    Несколько слов через запятую. Запись должна содержать все указанные слова.
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: colors.textMuted }}>Языки в записи</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {LANG_FILTER_OPTIONS.map(({ value, label }) => {
                      const checked = draftFilters.langs.includes(value);
                      return (
                        <label
                          key={value}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            fontSize: '14px', color: colors.text, cursor: 'pointer', userSelect: 'none',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setDraftFilters((f) => ({
                                ...f,
                                langs: checked
                                  ? f.langs.filter((lang) => lang !== value)
                                  : [...f.langs, value],
                              }));
                            }}
                            style={{ width: '16px', height: '16px', accentColor: colors.primary, cursor: 'pointer' }}
                          />
                          {label}
                        </label>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '12px', color: colors.textFaint, lineHeight: 1.4 }}>
                    Запись должна содержать слова на всех выбранных языках.
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: colors.textMuted }}>Говорящие</label>
                  <SpeakerFilterSelect
                    value={draftFilters.speakers}
                    onChange={(speakers) => setDraftFilters((f) => ({ ...f, speakers }))}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: colors.textMuted }}>Статус</label>
                  <SelectDropdown
                    value={draftFilters.status}
                    onChange={(status) => setDraftFilters((f) => ({ ...f, status }))}
                    options={STATUS_FILTER_OPTIONS}
                    ariaLabel="Статус обработки"
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: colors.textMuted }}>Дата с</label>
                    <input
                      type="date"
                      value={draftFilters.dateFrom}
                      onChange={(e) => setDraftFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                      style={filterFieldStyle}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: colors.textMuted }}>Дата по</label>
                    <input
                      type="date"
                      value={draftFilters.dateTo}
                      onChange={(e) => setDraftFilters((f) => ({ ...f, dateTo: e.target.value }))}
                      style={filterFieldStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={resetFilters}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ececec')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.page)}
                    style={{ backgroundColor: colors.page, color: '#333', border: `1px solid ${colors.borderStrong}`, padding: '8px 14px', borderRadius: radius.sm, fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                  >
                    Сбросить
                  </button>
                  <button
                    type="button"
                    onClick={applyFilters}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.primaryHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.primary)}
                    style={{ backgroundColor: colors.primary, color: '#fff', border: 'none', padding: '8px 14px', borderRadius: radius.sm, fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                  >
                    Применить
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          className={isNarrow ? undefined : 'panel-scroll panel-scroll--left'}
          style={{
            flex: 1,
            minHeight: 0,
            boxSizing: 'border-box',
            width: '100%',
          }}
        >
          <div
            className={isNarrow ? undefined : 'panel-scroll__content'}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              width: '100%',
            }}
          >
            {isInitialLoading ? (
              <>
                <AudioRowSkeleton />
                <AudioRowSkeleton />
                <AudioRowSkeleton />
              </>
            ) : isEmpty ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: colors.textFaint, border: `2px dashed ${colors.disabledBg}`, borderRadius: radius.md }}>
                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px', color: colors.textMuted }}>
                  {searchQuery ? 'Ничего не найдено' : 'Пока нет аудиозаписей'}
                </div>
                <div style={{ fontSize: '14px' }}>
                  {searchQuery
                    ? 'Попробуйте изменить запрос или очистить поле поиска.'
                    : 'Загрузите первую аудиозапись, чтобы начать.'}
                </div>
              </div>
            ) : (
              combinedAudioList.map((audio) => (
                <AudioPlayer
                  key={audio.id}
                  audio={audio}
                  isSelected={selectedAudioId === audio.id}
                  isNavHighlighted={navHighlight?.audioId === audio.id}
                  onNavHighlightLeave={(event) => {
                    const next = event?.relatedTarget;
                    if (next?.closest?.('[data-nav-highlight-transcription]')) return;
                    setNavHighlight((current) => (
                      current?.audioId === audio.id ? null : current
                    ));
                  }}
                  seekToSec={
                    seekTarget?.audioId === audio.id ? seekTarget.startSec : undefined
                  }
                  onTranscribeToggle={handleTranscribeClick}
                  onDeleteSuccess={handleDeleteSuccess}
                  onMetadataUpdated={handleMetadataUpdated}
                  userRole={userRole}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {showTranscriptionColumn && (
      <div
        data-nav-highlight-transcription={navHighlight ? 'true' : undefined}
        style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        height: isNarrow ? 'auto' : '100%',
        alignItems: 'stretch',
        order: isNarrow ? 1 : undefined,
        overflow: isNarrow ? 'visible' : 'hidden',
      }}>
          {selectedAudioId ? (
            <>
              <div style={{ marginBottom: '20px', width: '100%', display: 'flex', justifyContent: 'flex-start', flexShrink: 0 }}>
                <h2 style={{ fontSize: isNarrow ? '22px' : '28px', fontWeight: 'bold', margin: 0, padding: 0, textAlign: 'left' }}>Транскрипция</h2>
              </div>
              <div
                className={isNarrow ? undefined : 'panel-scroll panel-scroll--right'}
                style={{
                  flex: isNarrow ? undefined : 1,
                  minHeight: 0,
                  width: '100%',
                }}
              >
                <div className={isNarrow ? undefined : 'panel-scroll__content'}>
                  <TranscriptionBox
                    transcriptionText={selectedTranscription}
                    transcriptionWords={selectedTranscriptionWords}
                    isLoading={isTranscribing}
                    audioName={currentAudioName}
                    audioId={selectedAudioId}
                    audioRecordedAt={selectedAudio?.recorded_at}
                    audioUploadedAt={selectedAudio?.uploaded_at}
                    highlightWordIndex={
                      navHighlight?.audioId === selectedAudioId
                        ? navHighlight.wordPosition
                        : null
                    }
                    onHighlightWordClear={() => setNavHighlight(null)}
                    canEdit={canManageCorpus(userRole)}
                    canDownloadJson={canManageCorpus(userRole)}
                    onWordsChanged={setSelectedTranscriptionWords}
                    onEditMetadata={canManageCorpus(userRole) ? () => setMetadataEditOpen(true) : undefined}
                  />
                </div>
              </div>
              <AudioMetadataEditModal
                open={metadataEditOpen}
                onClose={() => setMetadataEditOpen(false)}
                audioId={selectedAudioId}
                title={currentAudioName}
                recordedAt={selectedAudio?.recorded_at}
                uploadedAt={selectedAudio?.uploaded_at}
                onSaved={handleMetadataUpdated}
              />
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: isNarrow ? '160px' : 0, color: colors.waveformScrub, border: `2px dashed ${colors.disabledBg}`, borderRadius: radius.md, padding: '24px', textAlign: 'center' }}>
              Выберите аудиозапись для просмотра транскрипции
            </div>
          )}
      </div>
      )}
    </div>
  );
}

export default AudioPanel;
