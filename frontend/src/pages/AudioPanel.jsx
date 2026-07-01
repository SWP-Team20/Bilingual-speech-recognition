import { useState, useEffect, useRef } from 'react';
import { audioApi } from '../api/audioApi';
import AudioPlayer from '../components/AudioPlayer';
import TranscriptionBox from '../components/TranscriptionBox';
import { AudioRowSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/toastContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { colors, radius, shadow, MOBILE_BREAKPOINT } from '../theme';
import { isTerminal } from '../constants/status';

const EMPTY_FILTERS = { word: '', lang: '', speaker: '', status: '', dateFrom: '', dateTo: '' };

function AudioPanel({ userRole, pendingUploads, uploadVersion, searchQuery = '' }) {
  const [audioList, setAudioList] = useState([]);
  const [selectedAudioId, setSelectedAudioId] = useState(null);
  const [selectedTranscription, setSelectedTranscription] = useState('');
  const [selectedTranscriptionWords, setSelectedTranscriptionWords] = useState([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [totalStorageMb, setTotalStorageMb] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Filters: `filters` is what's applied to the list, `draftFilters` is the
  // in-progress state of the open filter panel.
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef(filters);
  const filterWrapRef = useRef(null);

  const toast = useToast();
  const isNarrow = useMediaQuery(MOBILE_BREAKPOINT);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    loadAudioList();
  }, [searchQuery]);

  useEffect(() => {
    if (uploadVersion > 0) loadAudioList();
  }, [uploadVersion]);

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
    try {
      const data = searchQuery
        ? await audioApi.searchByFilename(searchQuery)
        : await audioApi.fetchAudioList(activeFilters);
      setAudioList(data);
    } catch (error) {
      console.error("Ошибка загрузки аудио:", error);
      if (!silent) toast.error('Не удалось загрузить список аудиозаписей');
    } finally {
      setIsInitialLoading(false);
    }
    loadTotalStorage();
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

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

  // Native <select> renders with a different box than text inputs; normalize it
  // with appearance:none + a custom chevron so all fields share the same margins.
  const filterSelectStyle = {
    ...filterFieldStyle,
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    paddingRight: '30px',
    cursor: 'pointer',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23555555' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
  };

  const loadTotalStorage = async () => {
    try {
      const data = await audioApi.fetchTotalStorage();
      setTotalStorageMb(data.total_allocated_mb);
    } catch (error) {
      console.error("Ошибка загрузки общего размера хранилища:", error);
    }
  };

  const handleDeleteSuccess = () => {
    setSelectedAudioId(null);
    setSelectedTranscription('');
    setSelectedTranscriptionWords([]);
    loadAudioList();
    toast.success('Аудиозапись удалена');
  };

  const handleTranscribeClick = async (audioId) => {
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
    <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: isNarrow ? '28px' : '48px', height: isNarrow ? 'auto' : '100%', minHeight: 0 }}>
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
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: colors.textMuted }}>Слово в транскрипции</label>
                  <input
                    type="text"
                    value={draftFilters.word}
                    placeholder="Например: әни"
                    onChange={(e) => setDraftFilters((f) => ({ ...f, word: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }}
                    style={filterFieldStyle}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: colors.textMuted }}>Язык</label>
                  <select
                    value={draftFilters.lang}
                    onChange={(e) => setDraftFilters((f) => ({ ...f, lang: e.target.value }))}
                    style={filterSelectStyle}
                  >
                    <option value="">Все языки</option>
                    <option value="ru">Русский</option>
                    <option value="tt">Татарский</option>
                    <option value="unknown">Другой</option>
                  </select>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: colors.textMuted }}>Говорящий</label>
                  <input
                    type="text"
                    value={draftFilters.speaker}
                    placeholder="Например: мама"
                    onChange={(e) => setDraftFilters((f) => ({ ...f, speaker: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }}
                    style={filterFieldStyle}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: colors.textMuted }}>Статус</label>
                  <select
                    value={draftFilters.status}
                    onChange={(e) => setDraftFilters((f) => ({ ...f, status: e.target.value }))}
                    style={filterSelectStyle}
                  >
                    <option value="">Любой статус</option>
                    <option value="done">Обработано</option>
                    <option value="processing_text">В обработке</option>
                    <option value="error">Ошибка</option>
                  </select>
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

        <div style={{ flex: 1, overflowY: isNarrow ? 'visible' : 'auto', boxSizing: 'border-box', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
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
                  onTranscribeToggle={handleTranscribeClick}
                  onDeleteSuccess={handleDeleteSuccess}
                  userRole={userRole}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {showTranscriptionColumn && (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: isNarrow ? 'auto' : '100%', alignItems: 'stretch', order: isNarrow ? 1 : undefined }}>
        <div style={{ flex: 1, height: isNarrow ? 'auto' : '100%', minHeight: 0, width: '100%' }}>
          {selectedAudioId ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: isNarrow ? 'auto' : '100%', width: '100%' }}>
              <div style={{ marginBottom: '20px', width: '100%', display: 'flex', justifyContent: 'flex-start', flexShrink: 0 }}>
                <h2 style={{ fontSize: isNarrow ? '22px' : '28px', fontWeight: 'bold', margin: 0, padding: 0, textAlign: 'left' }}>Транскрипция</h2>
              </div>
              <TranscriptionBox
                transcriptionText={selectedTranscription}
                transcriptionWords={selectedTranscriptionWords}
                isLoading={isTranscribing}
                audioName={currentAudioName}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: colors.waveformScrub, border: `2px dashed ${colors.disabledBg}`, borderRadius: radius.md, padding: '24px', textAlign: 'center' }}>
              Выберите аудиозапись для просмотра транскрипции
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

export default AudioPanel;
