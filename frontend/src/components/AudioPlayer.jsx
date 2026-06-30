import React, { useState, useEffect, useRef, useMemo } from 'react';
import { audioApi } from '../api/audioApi';
import ConfirmDialog from './ui/ConfirmDialog';
import { useToast } from './ui/toastContext';
import { colors, radius, shadow } from '../theme';
import { isAudioProcessing as statusIsAudioProcessing, isTextProcessing as statusIsTextProcessing, isDone, isError } from '../constants/status';

const WAVEFORM_BARS = 46;

// Deterministic pseudo-random bar heights so each audio keeps a stable waveform
function buildWaveform(seedSource) {
  const seedStr = String(seedSource || '');
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) % 2147483647;
  }
  const heights = [];
  for (let i = 0; i < WAVEFORM_BARS; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483647;
    const base = (seed / 2147483647);
    heights.push(0.25 + base * 0.75);
  }
  return heights;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function AudioPlayer({ audio, index, isSelected, onTranscribeToggle, onDeleteSuccess, userRole }) {
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sizeMb, setSizeMb] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragRatio, setDragRatio] = useState(0);

  const audioRef = useRef(null);
  const waveRef = useRef(null);
  const objectUrlRef = useRef('');
  const toast = useToast();
  const waveform = useMemo(() => buildWaveform(audio.id), [audio.id]);

  // Status now comes straight from the parent (single polling source).
  const currentStatus = audio.status;
  const isUserRole = userRole?.toLowerCase() === 'user';
  const isDeleteDisabled = isDeleting || isUserRole;

  const isAudioProcessing = statusIsAudioProcessing(currentStatus);
  const isTextProcessing = statusIsTextProcessing(currentStatus);
  const isFullyDone = isDone(currentStatus);

  // Storage size (skips pending uploads)
  useEffect(() => {
    if (!audio.id || audio.isPending) return;
    let isMounted = true;
    audioApi.fetchAudioSizes(audio.id)
      .then((data) => { if (isMounted) setSizeMb(data.total_folder_mb); })
      .catch((error) => console.error("Ошибка при загрузке размера аудио:", error));
    return () => { isMounted = false; };
  }, [audio.id, audio.isPending, currentStatus]);

  // Revoke the object URL when unmounting
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  // Drag-to-scrub: track the cursor across the whole window while dragging
  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => setDragRatio(ratioFromClientX(e.clientX));
    const handleUp = (e) => {
      const ratio = ratioFromClientX(e.clientX);
      const el = audioRef.current;
      if (el && duration) {
        el.currentTime = ratio * duration;
        setCurrentTime(el.currentTime);
      }
      setIsDragging(false);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, duration]);

  // ---- Pending upload card ----
  if (audio.isPending) {
    return (
      <div style={{ width: '100%', boxSizing: 'border-box', textAlign: 'left' }}>
        <style>{`@keyframes pulseText { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }`}</style>
        <div style={{ fontWeight: '500', margin: '0 0 8px 0', color: colors.textMuted }}>
          Загрузка: {audio.name || audio.filename || `Аудио ${index + 1}`}
        </div>
        <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: radius.md, border: '1px dashed #bbb', boxSizing: 'border-box' }}>
          <div style={{ fontSize: '15px', color: colors.primary, textAlign: 'center', fontWeight: 'bold', animation: 'pulseText 1.5s infinite ease-in-out' }}>
            Файл загружается на сервер...
          </div>
        </div>
      </div>
    );
  }

  // ---- Audio still being processed by AI ----
  if (isAudioProcessing) {
    return (
      <div style={{ marginBottom: '16px', width: '100%', boxSizing: 'border-box', textAlign: 'left' }}>
        <style>{`@keyframes pulseText { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }`}</style>
        <div style={{ fontWeight: '500', margin: '0 0 8px 0', color: colors.textMuted }}>
          Загрузка: {audio.filename || `Аудио ${index + 1}`}
        </div>
        <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: radius.md, border: '1px dashed #bbb', boxSizing: 'border-box' }}>
          <div style={{ fontSize: '15px', color: colors.primary, textAlign: 'center', fontWeight: 'bold', animation: 'pulseText 1.5s infinite ease-in-out' }}>
            Аудио обрабатывается ИИ...
          </div>
        </div>
      </div>
    );
  }

  const activeRatio = isDragging ? dragRatio : (duration ? currentTime / duration : 0);

  return (
    <div style={{ marginBottom: '16px', width: '100%', boxSizing: 'border-box', textAlign: 'left' }}>
      <style>{`@keyframes chevronPulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }`}</style>
      <div style={{ fontWeight: '500', textAlign: 'left', padding: 0, margin: '0 0 8px 0', color: colors.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>Аудио {index + 1} ({audio.filename})</span>
        {sizeMb !== null && (
          <span style={{ fontWeight: '400', fontSize: '13px', color: colors.primary, backgroundColor: colors.primarySoft, padding: '2px 8px', borderRadius: radius.md, whiteSpace: 'nowrap' }}>
            {sizeMb} МБ
          </span>
        )}
      </div>

      <div
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = shadow.lg; e.currentTarget.style.borderColor = colors.primarySoftBorder; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = shadow.sm; e.currentTarget.style.borderColor = colors.border; }}
        style={{ backgroundColor: colors.surface, padding: '14px', borderRadius: radius.md, border: `1px solid ${colors.border}`, boxSizing: 'border-box', boxShadow: shadow.sm, transition: 'box-shadow 0.2s ease, border-color 0.2s ease' }}
      >
        <audio
          ref={audioRef}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          style={{ display: 'none' }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            disabled={loading}
            aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.darkHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.dark)}
            style={{
              flexShrink: 0, width: '40px', height: '40px', borderRadius: '50%', border: 'none',
              backgroundColor: colors.dark, color: '#fff', cursor: loading ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background-color 0.15s ease, transform 0.1s ease',
            }}
          >
            {loading ? (
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="3" />
                <path d="M12 3 a9 9 0 0 1 9 9" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" style={{ transformOrigin: 'center', animation: 'spin 0.8s linear infinite' }} />
              </svg>
            ) : isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                <rect x="1.5" y="1" width="3" height="10" rx="1" />
                <rect x="7.5" y="1" width="3" height="10" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                <path d="M2.5 1.3v9.4c0 .6.66.96 1.16.64l7.2-4.7a.76.76 0 0 0 0-1.28l-7.2-4.7A.76.76 0 0 0 2.5 1.3Z" />
              </svg>
            )}
          </button>

          {/* Time (reflects the drag position while scrubbing) */}
          <span style={{ flexShrink: 0, fontSize: '13px', color: isDragging ? colors.primary : colors.textMuted, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', minWidth: '78px', transition: 'color 0.15s ease' }}>
            {formatTime(isDragging ? dragRatio * duration : currentTime)}/{formatTime(duration)}
          </span>

          {/* Waveform (click, drag, or arrow keys to scrub) */}
          <div
            ref={waveRef}
            onMouseDown={startDrag}
            onKeyDown={handleWaveKeyDown}
            role="slider"
            tabIndex={0}
            aria-label="Перемотка аудио"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(isDragging ? dragRatio * duration : currentTime)}
            aria-valuetext={`${formatTime(isDragging ? dragRatio * duration : currentTime)} из ${formatTime(duration)}`}
            style={{ flex: 1, height: '36px', display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer', minWidth: 0, userSelect: 'none', outline: 'none' }}
          >
            {waveform.map((h, i) => {
              const filled = i / WAVEFORM_BARS <= activeRatio;
              const color = filled ? (isDragging ? colors.waveformScrub : colors.dark) : colors.waveform;
              return (
                <div
                  key={i}
                  style={{ flex: 1, height: `${Math.round(h * 100)}%`, minWidth: '2px', borderRadius: '2px', backgroundColor: color, transition: isDragging ? 'none' : 'background-color 0.1s linear' }}
                />
              );
            })}
          </div>

          {/* Transcription toggle (animated line + triangle) */}
          <button
            onClick={() => isFullyDone && onTranscribeToggle(audio.id)}
            disabled={!isFullyDone}
            aria-label={isSelected ? 'Спрятать транскрипцию' : 'Показать транскрипцию'}
            title={
              isTextProcessing ? 'Транскрипция генерируется ИИ...'
              : isError(currentStatus) ? 'Ошибка обработки'
              : isSelected ? 'Спрятать транскрипцию' : 'Показать транскрипцию'
            }
            onMouseEnter={(e) => { if (isFullyDone) e.currentTarget.style.backgroundColor = colors.primarySoft; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            style={{
              flexShrink: 0, width: '40px', height: '40px', borderRadius: radius.sm, border: 'none',
              backgroundColor: 'transparent',
              color: !isFullyDone ? colors.disabled : (isSelected ? colors.primaryHover : colors.primary),
              cursor: isFullyDone ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.15s ease',
            }}
          >
            <svg
              width="40" height="40" viewBox="0 0 24 24"
              style={{
                transform: isSelected ? 'rotate(-90deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: isTextProcessing ? 'chevronPulse 1.2s ease-in-out infinite' : 'none',
              }}
              aria-hidden="true"
            >
              <line x1="3.5" y1="4" x2="20.5" y2="4" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
              <path d="M4 8 H20 L12 20 Z" fill="currentColor" />
            </svg>
          </button>

          {/* Delete */}
          <button
            onClick={() => { if (!isDeleteDisabled) setConfirmOpen(true); }}
            disabled={isDeleteDisabled}
            aria-label="Удалить аудиозапись"
            onMouseEnter={(e) => { if (isDeleteDisabled) return; e.currentTarget.style.backgroundColor = colors.danger; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { if (isDeleteDisabled) return; e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = colors.danger; }}
            style={{
              flexShrink: 0, backgroundColor: 'transparent',
              color: isDeleteDisabled ? '#ccc' : colors.danger,
              border: `1px solid ${isDeleteDisabled ? colors.borderStrong : colors.danger}`,
              borderRadius: radius.sm, padding: '6px 10px',
              cursor: isDeleteDisabled ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: 'bold', height: '40px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: isUserRole ? 0.6 : 1, transition: 'all 0.2s ease',
            }}
          >
            {isDeleting ? '...' : '✕'}
          </button>
        </div>

        {(isTextProcessing || isError(currentStatus)) && (
          <div style={{ marginTop: '10px', fontSize: '13px', fontWeight: '500', color: isError(currentStatus) ? colors.danger : colors.primary }}>
            {isTextProcessing ? 'Транскрипция генерируется ИИ...' : 'Ошибка обработки'}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Удалить аудиозапись?"
        message={`Вы уверены, что хотите удалить "Аудио ${index + 1}"? Это действие нельзя отменить.`}
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        danger
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );

  function ratioFromClientX(clientX) {
    const node = waveRef.current;
    if (!node) return 0;
    const rect = node.getBoundingClientRect();
    return Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
  }

  function startDrag(e) {
    setDragRatio(ratioFromClientX(e.clientX));
    setIsDragging(true);
  }

  function handleWaveKeyDown(e) {
    const el = audioRef.current;
    if (!el || !duration) return;
    let next = null;
    if (e.key === 'ArrowRight') next = Math.min(el.currentTime + 5, duration);
    else if (e.key === 'ArrowLeft') next = Math.max(el.currentTime - 5, 0);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = duration;
    else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); togglePlay(); return; }
    if (next !== null) {
      e.preventDefault();
      el.currentTime = next;
      setCurrentTime(next);
    }
  }

  // Lazily fetch the audio blob the first time the user presses play.
  async function ensureLoaded() {
    if (objectUrlRef.current) return objectUrlRef.current;
    const url = await audioApi.fetchAudioFile(audio.id, 'processed');
    objectUrlRef.current = url;
    if (audioRef.current) audioRef.current.src = url;
    return url;
  }

  async function togglePlay() {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      if (!objectUrlRef.current) {
        setLoading(true);
        try {
          await ensureLoaded();
        } catch (error) {
          console.error(error);
          toast.error('Не удалось загрузить аудиозапись');
          setLoading(false);
          return;
        }
        setLoading(false);
      }
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }

  async function handleDeleteConfirmed() {
    setConfirmOpen(false);
    try {
      setIsDeleting(true);
      await audioApi.deleteAudio(audio.id);
      if (onDeleteSuccess) onDeleteSuccess();
    } catch (error) {
      console.error("Ошибка при удалении аудио:", error);
      toast.error('Не удалось удалить аудиозапись');
    } finally {
      setIsDeleting(false);
    }
  }
}

export default AudioPlayer;
