import { useEffect, useState } from 'react';
import { audioApi } from '../api/audioApi';
import Modal from './ui/Modal';
import { useToast } from './ui/toastContext';
import { colors, radius, focusRing } from '../theme';
import { toDateInputValue } from '../utils/recordingDate';

function todayStr() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export default function AudioMetadataEditModal({
  open,
  onClose,
  audioId,
  title: initialTitle = '',
  recordedAt,
  uploadedAt,
  onSaved,
}) {
  const toast = useToast();
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editError, setEditError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEditTitle(initialTitle || '');
    setEditDate(toDateInputValue(recordedAt || uploadedAt));
    setEditError('');
  }, [open, initialTitle, recordedAt, uploadedAt]);

  const editDateTooLate = editDate && editDate > todayStr();

  const inputBaseStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    borderRadius: radius.sm,
    border: `1px solid ${colors.borderStrong}`,
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
  };

  const focusHandlers = {
    onFocus: (e) => { e.currentTarget.style.boxShadow = focusRing; },
    onBlur: (e) => { e.currentTarget.style.boxShadow = 'none'; },
  };

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleSave = async () => {
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle || editDateTooLate || !audioId) return;

    const payload = {};
    if (trimmedTitle !== (initialTitle || '')) payload.title = trimmedTitle;
    const currentDate = toDateInputValue(recordedAt || uploadedAt);
    if (editDate !== currentDate) payload.recordedAt = editDate || null;

    if (!payload.title && payload.recordedAt === undefined) {
      handleClose();
      return;
    }

    setIsSaving(true);
    setEditError('');
    try {
      await audioApi.updateAudioMetadata(audioId, payload);
      onClose();
      if (onSaved) onSaved();
      toast.success('Данные аудиозаписи обновлены');
    } catch (error) {
      const detail = error.response?.data?.detail;
      setEditError(typeof detail === 'string' ? detail : 'Не удалось сохранить изменения');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} maxWidth="460px" closeOnBackdrop={!isSaving} animate={false}>
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
          disabled={isSaving}
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
          disabled={isSaving}
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
          onClick={handleClose}
          disabled={isSaving}
          onMouseEnter={(e) => { if (!isSaving) e.currentTarget.style.backgroundColor = '#ececec'; }}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.page)}
          style={{
            backgroundColor: colors.page, color: '#333', border: `1px solid ${colors.borderStrong}`,
            padding: '10px 18px', borderRadius: radius.sm, fontWeight: 600,
            cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.6 : 1,
            transition: 'background-color 0.15s ease',
          }}
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !editTitle.trim() || editDateTooLate}
          onMouseEnter={(e) => {
            if (!isSaving && editTitle.trim() && !editDateTooLate) {
              e.currentTarget.style.backgroundColor = colors.primaryHover;
            }
          }}
          onMouseLeave={(e) => {
            if (!isSaving && editTitle.trim() && !editDateTooLate) {
              e.currentTarget.style.backgroundColor = colors.primary;
            }
          }}
          style={{
            backgroundColor: colors.primary, color: '#fff', border: 'none',
            padding: '10px 18px', borderRadius: radius.sm, fontWeight: 'bold',
            cursor: (isSaving || !editTitle.trim() || editDateTooLate) ? 'not-allowed' : 'pointer',
            opacity: (isSaving || !editTitle.trim() || editDateTooLate) ? 0.5 : 1,
            transition: 'background-color 0.15s ease',
          }}
        >
          {isSaving ? 'Сохранение…' : 'Сохранить'}
        </button>
      </div>
    </Modal>
  );
}
