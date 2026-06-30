import { useState, useEffect } from 'react';
import { audioApi } from '../api/audioApi';
import AudioPlayer from '../components/AudioPlayer';
import TranscriptionBox from '../components/TranscriptionBox';
import { AudioRowSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/toastContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { colors, radius, MOBILE_BREAKPOINT } from '../theme';
import { isTerminal } from '../constants/status';

function AudioPanel({ userRole, pendingUploads, uploadVersion }) {
  const [audioList, setAudioList] = useState([]);
  const [selectedAudioId, setSelectedAudioId] = useState(null);
  const [selectedTranscription, setSelectedTranscription] = useState('');
  const [selectedTranscriptionWords, setSelectedTranscriptionWords] = useState([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [totalStorageMb, setTotalStorageMb] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const toast = useToast();
  const isNarrow = useMediaQuery(MOBILE_BREAKPOINT);

  useEffect(() => {
    loadAudioList();
  }, []);

  useEffect(() => {
    if (uploadVersion > 0) loadAudioList();
  }, [uploadVersion]);

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

  const loadAudioList = async ({ silent = false } = {}) => {
    try {
      const data = await audioApi.fetchAudioList();
      setAudioList(data);
    } catch (error) {
      console.error("Ошибка загрузки аудио:", error);
      if (!silent) toast.error('Не удалось загрузить список аудиозаписей');
    } finally {
      setIsInitialLoading(false);
    }
    loadTotalStorage();
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

  const selectedAudioIndex = audioList.findIndex(a => a.id === selectedAudioId);
  const currentAudioName = selectedAudioIndex !== -1 ? `Аудио ${selectedAudioIndex + 1}` : '';
  const combinedAudioList = [...pendingUploads, ...audioList];
  const isEmpty = !isInitialLoading && combinedAudioList.length === 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: isNarrow ? '28px' : '48px', height: isNarrow ? 'auto' : '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: isNarrow ? 'auto' : '100%', alignItems: 'stretch' }}>
        <div style={{ marginBottom: '20px', width: '100%', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, padding: 0, textAlign: 'left', lineHeight: 1 }}>Аудиозаписи</h2>
          {totalStorageMb !== null && (
            <span style={{ fontSize: '14px', fontWeight: '500', lineHeight: 1, color: colors.primary, backgroundColor: colors.primarySoft, padding: '4px 10px', borderRadius: radius.lg, whiteSpace: 'nowrap', transform: 'translateY(3px)' }}>
              Всего: {totalStorageMb} МБ
            </span>
          )}
        </div>

        <div style={{ flex: 1, overflowY: isNarrow ? 'visible' : 'auto', paddingRight: isNarrow ? 0 : '12px', boxSizing: 'border-box', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            {isInitialLoading ? (
              <>
                <AudioRowSkeleton />
                <AudioRowSkeleton />
                <AudioRowSkeleton />
              </>
            ) : isEmpty ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: colors.textFaint, border: `2px dashed ${colors.disabledBg}`, borderRadius: radius.md }}>
                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px', color: colors.textMuted }}>Пока нет аудиозаписей</div>
                <div style={{ fontSize: '14px' }}>Загрузите первую аудиозапись, чтобы начать.</div>
              </div>
            ) : (
              combinedAudioList.map((audio, index) => (
                <AudioPlayer
                  key={audio.id}
                  audio={audio}
                  index={audio.isPending ? null : index - pendingUploads.length}
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

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: isNarrow ? 'auto' : '100%', alignItems: 'stretch' }}>
        <div style={{ flex: 1, height: isNarrow ? 'auto' : '100%', minHeight: isNarrow ? '240px' : 0, width: '100%' }}>
          {selectedAudioId ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
              <div style={{ marginBottom: '20px', width: '100%', display: 'flex', justifyContent: 'flex-start', flexShrink: 0 }}>
                <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, padding: 0, textAlign: 'left' }}>Транскрипция</h2>
              </div>
              <TranscriptionBox
                transcriptionText={selectedTranscription}
                transcriptionWords={selectedTranscriptionWords}
                isLoading={isTranscribing}
                audioName={currentAudioName}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: isNarrow ? '200px' : 'auto', color: colors.waveformScrub, border: `2px dashed ${colors.disabledBg}`, borderRadius: radius.md, padding: '24px', textAlign: 'center' }}>
              Выберите аудиозапись для просмотра транскрипции
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AudioPanel;
