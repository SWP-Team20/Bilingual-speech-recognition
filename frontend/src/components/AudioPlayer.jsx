import React, { useState, useEffect, useRef, useMemo } from 'react';
import { audioApi } from '../api/audioApi';
import ConfirmDialog from './ui/ConfirmDialog';
import Modal from './ui/Modal';
import { useToast } from './ui/toastContext';
import { colors, radius, shadow, focusRing } from '../theme';
import { isAudioProcessing as statusIsAudioProcessing, isTextProcessing as statusIsTextProcessing, isDone, isError } from '../constants/status';
import { canManageCorpus } from '../constants/roleTranslations';

const WAVEFORM_BARS = 46;
const CONTROLS_GAP = '12px';
const ACTION_BUTTONS_GAP = '4px';

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

// Recording date as DD.MM.YYYY (falls back to the upload date)
function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${d.getFullYear()}`;
}

function toDateInputValue(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

function todayStr() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

function AudioPlayer({ audio, isSelected, onTranscribeToggle, onDeleteSuccess, onMetadataUpdated, userRole }) {
  const [loading, setLoading] = useState(false);
  const [downloadingType, setDownloadingType] = useState(null);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editError, setEditError] = useState('');
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);
  const [sizeMb, setSizeMb] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragRatio, setDragRatio] = useState(0);

  const audioRef = useRef(null);
  const waveRef = useRef(null);
  const downloadMenuRef = useRef(null);
  const objectUrlRef = useRef('');
  const toast = useToast();
  const waveform = useMemo(() => buildWaveform(audio.id), [audio.id]);

  // Status now comes straight from the parent (single polling source).
  const currentStatus = audio.status;
  const canManage = canManageCorpus(userRole);
  const isDeleteDisabled = isDeleting;
  const isDownloading = downloadingType !== null;

  const isAudioProcessing = statusIsAudioProcessing(currentStatus);
  const isTextProcessing = statusIsTextProcessing(currentStatus);
  const isFullyDone = isDone(currentStatus);
  const displayDate = formatDate(audio.recorded_at || audio.uploaded_at);
  const editDateTooLate = editDate && editDate > todayStr();

  const inputBaseStyle = {
    width: '100%',
    margin: 0,
    display: 'block',
    padding: '10px 12px',
    borderRadius: radius.sm,
    border: `1px solid ${colors.borderStrong}`,
    boxSizing: 'border-box',
    outline: 'none',
    fontSize: '14px',
    fontFamily: 'inherit',
    backgroundColor: colors.surface,
    color: colors.text,
  };

  const focusHandlers = {
    onFocus: (e) => {
      e.currentTarget.style.borderColor = colors.primary;
      e.currentTarget.style.boxShadow = focusRing;
    },
    onBlur: (e) => {
      e.currentTarget.style.borderColor = colors.borderStrong;
      e.currentTarget.style.boxShadow = 'none';
    },
  };

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

  // Close the download menu on outside click or Escape
  useEffect(() => {
    if (!downloadMenuOpen) return;
    const handleClickOutside = (e) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target)) {
        setDownloadMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => { if (e.key === 'Escape') setDownloadMenuOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [downloadMenuOpen]);

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
          Загрузка: {audio.name || audio.filename || 'Аудиозапись'}
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
          Загрузка: {audio.filename || 'Аудиозапись'}
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
      <div style={{ margin: '0 0 8px 0', color: colors.text, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, fontWeight: '500', fontSize: '14px', lineHeight: '20px' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '20px' }}>{audio.filename}</span>
          {canManage && (
            <button
              type="button"
              onClick={openEditModal}
              aria-label="Изменить название и дату"
              title="Изменить название и дату"
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.primarySoft; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              style={{
                flexShrink: 0, width: '20px', height: '20px', padding: 0, border: 'none', borderRadius: radius.sm,
                backgroundColor: 'transparent', color: colors.textMuted, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background-color 0.15s ease, color 0.15s ease',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>
          )}
          {sizeMb !== null && (
            <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', height: '20px', fontWeight: '400', fontSize: '13px', lineHeight: 1, color: colors.primary, backgroundColor: colors.primarySoft, padding: '0 8px', borderRadius: radius.md, whiteSpace: 'nowrap' }}>
              {sizeMb} МБ
            </span>
          )}
        </div>
        {displayDate && (
          <span style={{ flexShrink: 0, fontSize: '14px', fontWeight: '500', lineHeight: '20px', color: colors.textMuted, whiteSpace: 'nowrap' }}>
            {displayDate}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: CONTROLS_GAP }}>
          {/* Play + download (tight), then time — same spacing to waveform */}
          <div style={{ display: 'flex', alignItems: 'center', gap: CONTROLS_GAP, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: ACTION_BUTTONS_GAP, flexShrink: 0 }}>
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

          {/* Download menu: choose original or processed audio (manager/admin only) */}
          {canManage && (
          <div ref={downloadMenuRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => { if (!isDownloading) setDownloadMenuOpen((open) => !open); }}
              disabled={isDownloading}
              aria-haspopup="menu"
              aria-expanded={downloadMenuOpen}
              aria-label="Скачать аудиозапись"
              title="Скачать"
              onMouseEnter={(e) => { if (!isDownloading) e.currentTarget.style.backgroundColor = colors.page; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              style={{
                flexShrink: 0, width: '40px', height: '40px', borderRadius: radius.sm, border: 'none',
                backgroundColor: 'transparent', color: colors.dark,
                cursor: isDownloading ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background-color 0.15s ease',
              }}
            >
              {isDownloading ? (
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <circle cx="12" cy="12" r="9" fill="none" stroke={colors.waveform} strokeWidth="3" />
                  <path d="M12 3 a9 9 0 0 1 9 9" fill="none" stroke={colors.dark} strokeWidth="3" strokeLinecap="round" style={{ transformOrigin: 'center', animation: 'spin 0.8s linear infinite' }} />
                </svg>
              ) : (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3v12" />
                  <path d="M7 10l5 5 5-5" />
                  <path d="M4 19h16" />
                </svg>
              )}
            </button>

            {downloadMenuOpen && (
              <div
                role="menu"
                style={{
                  position: 'absolute', top: '46px', left: 0, backgroundColor: colors.surface,
                  minWidth: '230px', borderRadius: radius.md, border: `1px solid ${colors.border}`,
                  boxShadow: shadow.lg, zIndex: 1000, overflow: 'hidden',
                  display: 'flex', flexDirection: 'column', animation: 'downloadMenuIn 0.14s ease-out',
                }}
              >
                <style>{`@keyframes downloadMenuIn { from { opacity: 0; transform: translateY(-6px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
                <div style={{ padding: '8px 14px 4px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.04em', textTransform: 'uppercase', color: colors.textFaint }}>
                  Скачать аудио
                </div>
                <button
                  role="menuitem"
                  onClick={() => handleDownload('original')}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.primarySoft; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  style={{
                    padding: '10px 14px', backgroundColor: 'transparent', border: 'none', textAlign: 'left',
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', flexDirection: 'column', gap: '2px',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: '600', color: colors.text }}>Оригинал</span>
                  <span style={{ fontSize: '12px', color: colors.textMuted }}>Исходный файл, как был загружен</span>
                </button>
                <div style={{ height: '1px', backgroundColor: colors.divider, width: '100%' }} />
                <button
                  role="menuitem"
                  onClick={() => handleDownload('processed')}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.primarySoft; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  style={{
                    padding: '10px 14px', backgroundColor: 'transparent', border: 'none', textAlign: 'left',
                    cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: '2px',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: '600', color: colors.text }}>Обработанное</span>
                  <span style={{ fontSize: '12px', color: colors.textMuted }}>С вырезанными паузами</span>
                </button>
              </div>
            )}
          </div>
          )}

          </div>

          {/* Time (reflects the drag position while scrubbing) */}
          <span style={{ flexShrink: 0, fontSize: '13px', color: isDragging ? colors.primary : colors.textMuted, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', transition: 'color 0.15s ease' }}>
            {formatTime(isDragging ? dragRatio * duration : currentTime)}/{formatTime(duration)}
          </span>
          </div>

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

          {/* Action buttons grouped tightly together */}
          <div style={{ display: 'flex', alignItems: 'center', gap: ACTION_BUTTONS_GAP, flexShrink: 0 }}>
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
          {canManage && (
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
              transition: 'all 0.2s ease',
            }}
          >
            {isDeleting ? '...' : '✕'}
          </button>
          )}
          </div>
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
        message={`Вы уверены, что хотите удалить «${audio.filename}»? Это действие нельзя отменить.`}
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        danger
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmOpen(false)}
      />

      <Modal open={editOpen} onClose={closeEditModal} maxWidth="460px" closeOnBackdrop={!isSavingMetadata}>
        <h4 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 18px 0', color: colors.textStrong }}>
          Изменить аудиозапись
        </h4>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
            Название
          </label>
          <input
            type="text"
            value={editTitle}
            placeholder="Название аудиозаписи"
            disabled={isSavingMetadata}
            onChange={(e) => { setEditTitle(e.target.value); if (editError) setEditError(''); }}
            style={{ ...inputBaseStyle, borderColor: editError ? colors.danger : colors.borderStrong }}
            {...focusHandlers}
          />
        </div>

        <div style={{ marginBottom: editError || editDateTooLate ? '8px' : '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
            Дата записи
          </label>
          <input
            type="date"
            value={editDate}
            max={todayStr()}
            disabled={isSavingMetadata}
            onChange={(e) => { setEditDate(e.target.value); if (editError) setEditError(''); }}
            style={{ ...inputBaseStyle, borderColor: editDateTooLate ? colors.danger : colors.borderStrong }}
            {...focusHandlers}
          />
        </div>

        {editDateTooLate && (
          <div style={{ marginBottom: '16px', fontSize: '13px', fontWeight: 500, color: colors.danger }}>
            Дата записи не может быть позже сегодняшней
          </div>
        )}

        {editError && (
          <div style={{ marginBottom: '16px', fontSize: '13px', fontWeight: 500, color: colors.danger }}>
            {editError}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={closeEditModal}
            disabled={isSavingMetadata}
            onMouseEnter={(e) => { if (!isSavingMetadata) e.currentTarget.style.backgroundColor = '#ececec'; }}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.page)}
            style={{ backgroundColor: colors.page, color: '#333', border: `1px solid ${colors.borderStrong}`, padding: '10px 18px', borderRadius: radius.sm, fontWeight: 600, cursor: isSavingMetadata ? 'not-allowed' : 'pointer', opacity: isSavingMetadata ? 0.6 : 1, transition: 'background-color 0.15s ease' }}
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSaveMetadata}
            disabled={isSavingMetadata || !editTitle.trim() || editDateTooLate}
            onMouseEnter={(e) => { if (!isSavingMetadata && editTitle.trim() && !editDateTooLate) e.currentTarget.style.backgroundColor = colors.primaryHover; }}
            onMouseLeave={(e) => { if (!isSavingMetadata && editTitle.trim() && !editDateTooLate) e.currentTarget.style.backgroundColor = colors.primary; }}
            style={{ backgroundColor: colors.primary, color: '#fff', border: 'none', padding: '10px 18px', borderRadius: radius.sm, fontWeight: 'bold', cursor: (isSavingMetadata || !editTitle.trim() || editDateTooLate) ? 'not-allowed' : 'pointer', opacity: (isSavingMetadata || !editTitle.trim() || editDateTooLate) ? 0.5 : 1, transition: 'background-color 0.15s ease' }}
          >
            {isSavingMetadata ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </Modal>
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

  async function handleDownload(type) {
    if (!canManage || isDownloading) return;
    setDownloadMenuOpen(false);
    setDownloadingType(type);
    try {
      await audioApi.downloadAudioFile(audio.id, type, audio.filename);
    } catch (error) {
      console.error("Ошибка при скачивании аудио:", error);
      toast.error('Не удалось скачать аудиозапись');
    } finally {
      setDownloadingType(null);
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

  function openEditModal() {
    setEditTitle(audio.filename || '');
    setEditDate(toDateInputValue(audio.recorded_at || audio.uploaded_at));
    setEditError('');
    setEditOpen(true);
  }

  function closeEditModal() {
    if (isSavingMetadata) return;
    setEditOpen(false);
    setEditError('');
  }

  async function handleSaveMetadata() {
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle || editDateTooLate) return;

    const payload = {};
    if (trimmedTitle !== audio.filename) payload.title = trimmedTitle;
    const currentDate = toDateInputValue(audio.recorded_at || audio.uploaded_at);
    if (editDate !== currentDate) payload.recordedAt = editDate || null;

    if (!payload.title && payload.recordedAt === undefined) {
      closeEditModal();
      return;
    }

    setIsSavingMetadata(true);
    setEditError('');
    try {
      await audioApi.updateAudioMetadata(audio.id, payload);
      setEditOpen(false);
      if (onMetadataUpdated) onMetadataUpdated();
      toast.success('Данные аудиозаписи обновлены');
    } catch (error) {
      const detail = error.response?.data?.detail;
      setEditError(typeof detail === 'string' ? detail : 'Не удалось сохранить изменения');
    } finally {
      setIsSavingMetadata(false);
    }
  }
}

export default AudioPlayer;
