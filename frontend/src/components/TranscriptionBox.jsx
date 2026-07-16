import React, { useEffect, useMemo, useRef, useState } from 'react';
import { audioApi } from '../api/audioApi';
import { speakersApi } from '../api/speakersApi';
import { formatRecordingDate } from '../utils/recordingDate';
import { useToast } from './ui/toastContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import SelectDropdown from './SelectDropdown';
import { MOBILE_BREAKPOINT, colors, radius } from '../theme';

const LANG_OPTIONS = [
  { value: 'ru', label: 'Русский' },
  { value: 'tt', label: 'Татарский' },
  { value: 'unknown', label: 'Другой' },
];

const LANG_BADGES = [
  { key: 'ru', label: 'Русский', color: '#000000' },
  { key: 'tt', label: 'Татарский', color: '#009a55' },
  { key: 'unknown', label: 'Другой', color: '#9a9a9a' },
];

// Цвет слова по языку: татарский — зелёный, «другой» — серый, русский — тёмный.
const langColor = (lang) => (lang === 'tt' ? '#009a55' : lang === 'unknown' ? '#9a9a9a' : '#333');

function speakerLabelStyle({ canEdit = false, active = false } = {}) {
  return {
    display: 'inline-block',
    fontSize: '17px',
    fontWeight: 700,
    color: '#15803d',
    letterSpacing: '0.01em',
    lineHeight: 1.3,
    cursor: canEdit ? 'pointer' : 'default',
    borderRadius: '6px',
    padding: canEdit ? '2px 4px 2px 0' : 0,
    margin: 0,
    verticalAlign: 'baseline',
    backgroundColor: active ? '#eafaf1' : 'transparent',
    outline: canEdit ? '1px dashed transparent' : 'none',
  };
}

// Группировка плоского массива слов в реплики по смене говорящего.
// Сохраняем ГЛОБАЛЬНЫЙ индекс каждого слова (== position в БД) — он нужен для правки.
const UNASSIGNED_SPEAKER_LABEL = 'Говорящий 1';

function groupBySpeaker(words) {
  const paragraphs = [];
  let cur = null;
  words.forEach((w, gi) => {
    const speaker = w.speaker || UNASSIGNED_SPEAKER_LABEL;
    if (!cur || cur.speaker !== speaker) {
      cur = { speaker, items: [] };
      paragraphs.push(cur);
    }
    cur.items.push({ w, gi });
  });
  return paragraphs;
}

function countLangs(words) {
  const c = { total: words.length, ru: 0, tt: 0, unknown: 0 };
  words.forEach((w) => {
    if (w.lang === 'tt') c.tt += 1;
    else if (w.lang === 'unknown') c.unknown += 1;
    else c.ru += 1;
  });
  return c;
}

function TranscriptionBox({
  transcriptionText,
  transcriptionWords,
  sentences,
  audioName,
  audioId,
  audioRecordedAt,
  audioUploadedAt,
  highlightWordIndex = null,
  onHighlightWordClear,
  canEdit = false,
  canDownloadJson = false,
  onWordsChanged,
  onEditMetadata,
}) {
  const toast = useToast();
  const downloadMenuRef = useRef(null);
  const highlightWordRef = useRef(null);
  // editor: { mode: 'edit' | 'add', index, raw, language } | null
  const [editor, setEditor] = useState(null);
  // speakerEditor: { paragraphIdx, currentLabel, selectedId, customLabel, mode: 'existing' | 'custom' } | null
  const [speakerEditor, setSpeakerEditor] = useState(null);
  const [speakers, setSpeakers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState(null);
  const [selectedIndices, setSelectedIndices] = useState(() => new Set());
  const [selectionAnchor, setSelectionAnchor] = useState(null);
  const [bulkLanguage, setBulkLanguage] = useState('ru');
  const [bulkSpeakerId, setBulkSpeakerId] = useState('');
  const [bulkSpeakerLabel, setBulkSpeakerLabel] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  const isNarrow = useMediaQuery(MOBILE_BREAKPOINT);
  const isCoarsePointer = useMediaQuery('(pointer: coarse)');
  const useTouchSelection = isNarrow || isCoarsePointer;

  const isDownloading = downloadingFormat !== null;
  const selectedCount = selectedIndices.size;
  const showBulkToolbar = selectedCount >= (selectionMode ? 1 : 2);

  const words = transcriptionWords || [];
  const counts = countLangs(words);
  const paragraphs = useMemo(() => groupBySpeaker(words), [words]);

  useEffect(() => {
    if (!downloadMenuOpen) return;
    const handleClickOutside = (e) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target)) {
        setDownloadMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setDownloadMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [downloadMenuOpen]);

  useEffect(() => {
    setSelectedIndices(new Set());
    setSelectionAnchor(null);
    setSelectionMode(false);
    setEditor(null);
    setSpeakerEditor(null);
    setBulkSpeakerId('');
    setBulkSpeakerLabel('');
    setCanUndo(false);
  }, [audioId]);

  useEffect(() => {
    if (highlightWordIndex == null) return;
    const timer = window.setTimeout(() => {
      highlightWordRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [highlightWordIndex, audioId]);

  useEffect(() => {
    if (!showBulkToolbar || speakers.length) return;
    speakersApi.listSpeakers()
      .then((list) => setSpeakers(Array.isArray(list) ? list : []))
      .catch((error) => {
        console.error('Ошибка загрузки списка говорящих:', error);
      });
  }, [showBulkToolbar, speakers.length]);

  useEffect(() => {
    if (!canEdit || (selectedCount === 0 && !selectionMode)) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedIndices(new Set());
        setSelectionAnchor(null);
        setSelectionMode(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canEdit, selectedCount, selectionMode]);

  const clearSelection = () => {
    setSelectedIndices(new Set());
    setSelectionAnchor(null);
  };

  const exitSelectionMode = () => {
    clearSelection();
    setSelectionMode(false);
    setEditor(null);
    setSpeakerEditor(null);
  };

  const toggleSelectionMode = () => {
    if (selectionMode) {
      exitSelectionMode();
      return;
    }
    setEditor(null);
    setSpeakerEditor(null);
    clearSelection();
    setSelectionMode(true);
  };

  const toggleSelection = (index) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const clearNativeSelection = () => {
    window.getSelection?.()?.removeAllRanges();
  };

  const selectRange = (from, to, { union = false } = {}) => {
    const start = Math.min(from, to);
    const end = Math.max(from, to);
    setSelectedIndices((prev) => {
      const next = union ? new Set(prev) : new Set();
      for (let i = start; i <= end; i += 1) next.add(i);
      return next;
    });
    clearNativeSelection();
  };

  const handleDownload = async (format) => {
    if (!audioId || isDownloading) return;
    setDownloadMenuOpen(false);
    setDownloadingFormat(format);
    try {
      await audioApi.downloadTranscription(audioId, format, audioName);
    } catch (e) {
      console.error(e);
      toast.error('Не удалось скачать транскрипцию');
    } finally {
      setDownloadingFormat(null);
    }
  };

  const openEditor = (index) => {
    if (!canEdit || busy) return;
    setSpeakerEditor(null);
    const w = words[index];
    setEditor({ mode: 'edit', index, raw: w.raw ?? w.text ?? '', language: w.lang || 'unknown' });
  };

  const handleWordClick = (index, e) => {
    if (!canEdit || busy) return;
    if (selectionMode) {
      e.preventDefault();
      setSpeakerEditor(null);
      setEditor(null);
      if (e.shiftKey) {
        const anchor = selectionAnchor ?? index;
        if (selectionAnchor === null) setSelectionAnchor(index);
        selectRange(anchor, index, { union: true });
        return;
      }
      if (e.ctrlKey || e.metaKey) {
        toggleSelection(index);
        clearNativeSelection();
        return;
      }
      setSelectionAnchor(index);
      toggleSelection(index);
      clearNativeSelection();
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setSpeakerEditor(null);
      setEditor(null);
      setSelectionAnchor(index);
      toggleSelection(index);
      clearNativeSelection();
      return;
    }
    if (e.shiftKey) {
      e.preventDefault();
      setSpeakerEditor(null);
      setEditor(null);
      const anchor = selectionAnchor ?? index;
      if (selectionAnchor === null) setSelectionAnchor(index);
      selectRange(anchor, index);
      return;
    }
    clearSelection();
    setSelectionAnchor(index);
    openEditor(index);
  };

  const handleWordMouseDown = (e) => {
    if (!canEdit || busy) return;
    if (selectionMode || e.shiftKey || e.ctrlKey || e.metaKey) {
      e.preventDefault();
    }
  };
  const openAddAfter = (index) => setEditor({ mode: 'add', index, raw: '', language: 'unknown' });
  const closeEditor = () => { if (!busy) setEditor(null); };

  const openSpeakerEditor = async (paragraphIdx, currentLabel, wordIndices) => {
    if (!canEdit || busy) return;
    setEditor(null);
    setSpeakerEditor({
      paragraphIdx,
      currentLabel,
      wordPositions: wordIndices || [],
      selectedId: '',
      customLabel: currentLabel,
      mode: 'existing',
      scope: 'audio',
    });
    try {
      const list = await speakersApi.listSpeakers();
      setSpeakers(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      setSpeakers([]);
      toast.error('Не удалось загрузить список говорящих');
    }
  };
  const closeSpeakerEditor = () => { if (!busy) setSpeakerEditor(null); };

  const applyResult = (data) => {
    if (data && Array.isArray(data.words)) onWordsChanged?.(data.words);
    if (data && typeof data.undo_available === 'boolean') setCanUndo(data.undo_available);
  };

  const undoDelete = async () => {
    if (!audioId || busy) return;
    setBusy(true);
    try {
      const data = await audioApi.undoTranscriptionDelete(audioId);
      applyResult(data);
      toast.success('Удаление отменено');
      setEditor(null);
      clearSelection();
    } catch (e) {
      console.error(e);
      toast.error('Не удалось отменить удаление');
    } finally {
      setBusy(false);
    }
  };

  const saveSpeakerLabel = async () => {
    if (!speakerEditor || !audioId) return;
    const { currentLabel, mode, selectedId, customLabel, scope, wordPositions } = speakerEditor;
    const payload = { currentLabel, scope: scope || 'audio' };
    if (payload.scope === 'paragraph') {
      payload.wordPositions = wordPositions || [];
      if (!payload.wordPositions.length) {
        toast.error('Не удалось определить слова предложения');
        return;
      }
    }
    if (mode === 'existing') {
      if (!selectedId) {
        toast.error('Выберите говорящего из списка');
        return;
      }
      payload.speakerId = Number(selectedId);
    } else {
      const label = (customLabel || '').trim();
      if (!label) {
        toast.error('Метка не может быть пустой');
        return;
      }
      if (label === currentLabel && payload.scope === 'audio') {
        setSpeakerEditor(null);
        return;
      }
      payload.newLabel = label;
    }

    setBusy(true);
    try {
      const data = await audioApi.relabelSpeaker(audioId, payload);
      applyResult(data);
      toast.success(
        payload.scope === 'paragraph'
          ? 'Метка обновлена в этом предложении'
          : 'Метка обновлена во всей записи'
      );
      setSpeakerEditor(null);
    } catch (e) {
      console.error(e);
      const detail = e?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Не удалось изменить метку');
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    const raw = editor.raw.trim();
    // Пустое поле при правке = удаление слова
    if (!raw) {
      await doDelete();
      return;
    }
    setBusy(true);
    try {
      const data = await audioApi.editTranscriptionWord(audioId, editor.index, {
        raw, language: editor.language,
      });
      applyResult(data);
      const parts = raw.split(/\s+/).filter(Boolean);
      toast.success(parts.length > 1 ? `Сохранено как ${parts.length} слова` : 'Слово обновлено');
      setEditor(null);
    } catch (e) {
      console.error(e);
      toast.error('Не удалось обновить слово');
    } finally { setBusy(false); }
  };

  const doDelete = async () => {
    const index = editor.index;
    setEditor(null);
    setBusy(true);
    try {
      const data = await audioApi.deleteTranscriptionWord(audioId, index);
      applyResult(data);
    } catch (e) {
      console.error(e);
      toast.error('Не удалось удалить слово');
    } finally { setBusy(false); }
  };

  const doAdd = async () => {
    const raw = editor.raw.trim();
    if (!raw) { toast.error('Введите слово'); return; }
    setBusy(true);
    try {
      // mode 'add' вставляет ПОСЛЕ слова editor.index; при index<0 — в начало.
      const position = editor.index + 1;
      const data = await audioApi.addTranscriptionWord(audioId, {
        position, raw, language: editor.language,
      });
      applyResult(data);
      const parts = raw.split(/\s+/).filter(Boolean);
      toast.success(parts.length > 1 ? `Добавлено слов: ${parts.length}` : 'Слово добавлено');
      setEditor(null);
    } catch (e) {
      console.error(e);
      toast.error('Не удалось добавить слово');
    } finally { setBusy(false); }
  };

  const applyBulkLanguage = async () => {
    if (!audioId || selectedCount === 0 || busy) return;
    const positions = Array.from(selectedIndices).sort((a, b) => a - b);
    setBusy(true);
    try {
      const data = await audioApi.bulkEditTranscriptionWords(audioId, positions, { language: bulkLanguage });
      applyResult(data);
      toast.success(`Язык изменён у ${positions.length} слов`);
      if (selectionMode) exitSelectionMode();
      else clearSelection();
    } catch (e) {
      console.error(e);
      toast.error('Не удалось изменить язык выбранных слов');
    } finally {
      setBusy(false);
    }
  };

  const bulkDeleteWords = async () => {
    if (!audioId || selectedCount === 0 || busy) return;
    const positions = Array.from(selectedIndices).sort((a, b) => a - b);
    setEditor(null);
    setBusy(true);
    try {
      const data = await audioApi.bulkEditTranscriptionWords(audioId, positions, { delete: true });
      applyResult(data);
      if (selectionMode) exitSelectionMode();
      else clearSelection();
    } catch (e) {
      console.error(e);
      toast.error('Не удалось удалить выбранные слова');
    } finally {
      setBusy(false);
    }
  };

  const applyBulkSpeaker = async () => {
    if (!audioId || selectedCount === 0 || busy) return;
    const positions = Array.from(selectedIndices).sort((a, b) => a - b);
    let payload;
    if (bulkSpeakerId === '__custom__') {
      const label = bulkSpeakerLabel.trim();
      if (!label) {
        toast.error('Введите метку говорящего');
        return;
      }
      payload = { newLabel: label };
    } else if (bulkSpeakerId) {
      payload = { speakerId: Number(bulkSpeakerId) };
    } else {
      toast.error('Выберите говорящего');
      return;
    }

    setBusy(true);
    try {
      const data = await audioApi.bulkEditTranscriptionWords(audioId, positions, payload);
      applyResult(data);
      toast.success(`Говорящий назначен для ${positions.length} слов`);
      if (selectionMode) exitSelectionMode();
      else clearSelection();
    } catch (e) {
      console.error(e);
      const detail = e?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Не удалось назначить говорящего');
    } finally {
      setBusy(false);
    }
  };

  const renderSpeakerPopover = (paragraphIdx, speakerLabel) => {
    if (!speakerEditor || speakerEditor.paragraphIdx !== paragraphIdx) return null;
    const otherSpeakers = speakers.filter((s) => s.label !== speakerLabel);
    return (
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 70, marginTop: '6px',
          minWidth: '260px', backgroundColor: '#fff', border: '1px solid #e0e0e0',
          borderRadius: '10px', boxShadow: '0 6px 24px rgba(0,0,0,0.14)', padding: '12px',
          textAlign: 'left', cursor: 'default', fontWeight: 400, color: '#333',
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#888', marginBottom: '10px' }}>
          Метка говорящего
        </div>

        <div style={{
          marginBottom: '12px',
          paddingBottom: '12px',
          borderBottom: '1px solid #eee',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#888', marginBottom: '8px' }}>
            Область изменения
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '6px', cursor: 'pointer', color: '#333' }}>
            <input
              type="radio"
              name={`spk-scope-${paragraphIdx}`}
              checked={speakerEditor.scope !== 'paragraph'}
              disabled={busy}
              onChange={() => setSpeakerEditor((s) => ({ ...s, scope: 'audio' }))}
            />
            Во всей этой записи
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: '#333' }}>
            <input
              type="radio"
              name={`spk-scope-${paragraphIdx}`}
              checked={speakerEditor.scope === 'paragraph'}
              disabled={busy}
              onChange={() => setSpeakerEditor((s) => ({ ...s, scope: 'paragraph' }))}
            />
            Только это предложение
          </label>
        </div>

        <div style={{ fontSize: '12px', fontWeight: 600, color: '#888', marginBottom: '8px' }}>
          Новая метка
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '8px', cursor: 'pointer', color: '#333' }}>
          <input
            type="radio"
            name={`spk-mode-${paragraphIdx}`}
            checked={speakerEditor.mode === 'existing'}
            disabled={busy}
            onChange={() => setSpeakerEditor((s) => ({ ...s, mode: 'existing' }))}
          />
          Выбрать существующего
        </label>
        <SelectDropdown
          value={speakerEditor.selectedId}
          disabled={busy || speakerEditor.mode !== 'existing'}
          onChange={(selectedId) => setSpeakerEditor((s) => ({ ...s, selectedId, mode: 'existing' }))}
          placeholder="— выберите —"
          ariaLabel="Существующий говорящий"
          listZIndex={200}
          style={{ marginBottom: '10px' }}
          triggerStyle={{
            backgroundColor: speakerEditor.mode === 'existing' ? colors.surface : '#f7f7f7',
          }}
          options={[
            { value: '', label: '— выберите —' },
            ...otherSpeakers.map((s) => ({
              value: String(s.id),
              label: `${s.label}${s.audio_count ? ` (${s.audio_count})` : ''}`,
            })),
          ]}
        />

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '8px', cursor: 'pointer', color: '#333' }}>
          <input
            type="radio"
            name={`spk-mode-${paragraphIdx}`}
            checked={speakerEditor.mode === 'custom'}
            disabled={busy}
            onChange={() => setSpeakerEditor((s) => ({ ...s, mode: 'custom' }))}
          />
          Новая метка
        </label>
        <input
          type="text"
          value={speakerEditor.customLabel}
          disabled={busy || speakerEditor.mode !== 'custom'}
          onChange={(e) => setSpeakerEditor((s) => ({ ...s, customLabel: e.target.value, mode: 'custom' }))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveSpeakerLabel();
            if (e.key === 'Escape') closeSpeakerEditor();
          }}
          placeholder="например, мама"
          style={{
            width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: '14px',
            border: '1px solid #d0d0d0', borderRadius: '6px', outline: 'none', marginBottom: '10px',
            backgroundColor: speakerEditor.mode === 'custom' ? '#fff' : '#f7f7f7',
            color: '#333',
          }}
        />

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button type="button" disabled={busy} onClick={saveSpeakerLabel} style={btnStyle('#009a55', '#fff')}>
            Сохранить
          </button>
          <button type="button" disabled={busy} onClick={closeSpeakerEditor} style={btnStyle('#f2f2f2', '#444', '#ddd')}>
            Отмена
          </button>
        </div>
      </div>
    );
  };

  const renderPopover = (index) => {
    if (!editor || editor.index !== index) return null;
    const isAdd = editor.mode === 'add';
    return (
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 60, marginTop: '6px',
          minWidth: '230px', backgroundColor: '#fff', border: '1px solid #e0e0e0',
          borderRadius: '10px', boxShadow: '0 6px 24px rgba(0,0,0,0.14)', padding: '12px',
          textAlign: 'left', cursor: 'default', fontWeight: 400, color: '#333',
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#888', marginBottom: '6px' }}>
          {isAdd ? 'Новое слово' : 'Правка слова'}
        </div>
        {!isAdd && (
          <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px', lineHeight: 1.4 }}>
            Измените текст и язык, затем нажмите «Сохранить»
          </div>
        )}
        <input
          autoFocus
          type="text"
          value={editor.raw}
          disabled={busy}
          onChange={(e) => setEditor((s) => ({ ...s, raw: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { isAdd ? doAdd() : saveEdit(); }
            if (e.key === 'Escape') closeEditor();
          }}
          placeholder={isAdd ? 'Слово или несколько через пробел' : 'Введите слово'}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: '14px',
            border: '1px solid #d0d0d0', borderRadius: '6px', outline: 'none', marginBottom: '8px',
            color: '#333', backgroundColor: '#fff',
          }}
        />
        <SelectDropdown
          value={editor.language}
          disabled={busy}
          onChange={(language) => setEditor((s) => ({ ...s, language }))}
          options={LANG_OPTIONS}
          ariaLabel="Язык слова"
          listZIndex={200}
          style={{ marginBottom: '10px' }}
        />

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button" disabled={busy}
            onClick={isAdd ? doAdd : saveEdit}
            style={btnStyle('#009a55', '#fff')}
          >
            {isAdd ? 'Добавить' : 'Сохранить'}
          </button>
          {!isAdd && (
            <button type="button" disabled={busy} onClick={doDelete} style={btnStyle('#fff', '#d33', '#e6b3b3')}>
              Удалить
            </button>
          )}
          <button type="button" disabled={busy} onClick={closeEditor} style={btnStyle('#f2f2f2', '#444', '#ddd')}>
            Отмена
          </button>
        </div>

        {!isAdd && (
          <div style={{ fontSize: '11px', color: '#aaa', marginTop: '8px', lineHeight: 1.4 }}>
            Очистите поле и сохраните, либо нажмите «Удалить», чтобы убрать слово
          </div>
        )}
        {!isAdd && (
          <button
            type="button" disabled={busy}
            onClick={() => openAddAfter(index)}
            style={{ ...btnStyle('transparent', '#009a55', 'transparent'), marginTop: '8px', paddingLeft: 0 }}
          >
            + добавить слово после
          </button>
        )}
      </div>
    );
  };

  const hasWords = words.length > 0;
  const hasTranscription = hasWords || (sentences && sentences.length > 0) || Boolean(transcriptionText);
  const displayRecordingDate = formatRecordingDate(audioRecordedAt || audioUploadedAt);

  return (
    <div style={{
      backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e6e6e6',
      height: 'fit-content', boxSizing: 'border-box', width: '100%', boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      color: '#333',
    }}>
      {/* ================= LANGUAGE BADGES + LIVE COUNTS ================= */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', width: '100%', alignItems: 'center', flexWrap: 'wrap' }}>
        {LANG_BADGES.filter(({ key }) => counts[key] > 0).map(({ key, label, color }) => (
          <div key={key} style={badgeStyle(color)}>{label}</div>
        ))}
        {hasWords && (
          <span style={{ fontSize: '13px', color: '#777', marginLeft: 'auto' }}>
            Слов: <b>{counts.total}</b> · ру {counts.ru} · тат {counts.tt}
            {counts.unknown > 0 ? ` · др ${counts.unknown}` : ''}
          </span>
        )}
      </div>

      {/* ================= AUDIO FILE NAME + DOWNLOAD ================= */}
      {audioName && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          marginTop: '20px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px dashed #eee',
        }}>
          <div style={{ fontSize: '15px', lineHeight: '20px', color: '#555', textAlign: 'left', minWidth: 0 }}>
            <button
              type="button"
              disabled={!canEdit || !onEditMetadata}
              onClick={() => onEditMetadata?.()}
              title={canEdit ? 'Изменить название и дату записи' : undefined}
              onMouseEnter={(e) => {
                if (!canEdit || !onEditMetadata) return;
                e.currentTarget.style.backgroundColor = colors.page;
                e.currentTarget.style.borderColor = colors.borderStrong;
              }}
              onMouseLeave={(e) => {
                if (!canEdit || !onEditMetadata) return;
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }}
              style={{
                display: 'block',
                maxWidth: '100%',
                margin: 0,
                padding: canEdit ? '2px 4px 2px 0' : 0,
                border: '1px solid transparent',
                borderRadius: radius.sm,
                background: 'transparent',
                color: 'inherit',
                fontSize: 'inherit',
                lineHeight: 'inherit',
                fontFamily: 'inherit',
                textAlign: 'left',
                cursor: canEdit && onEditMetadata ? 'pointer' : 'default',
                transition: 'background-color 0.15s ease, border-color 0.15s ease',
              }}
            >
              <span style={{
                display: 'inline-flex',
                alignItems: 'baseline',
                maxWidth: '100%',
                minWidth: 0,
              }}
              >
                <span style={{
                  fontWeight: 700,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}
                >
                  {audioName}
                </span>
                {displayRecordingDate && (
                  <span style={{
                    flexShrink: 0,
                    marginLeft: '0.45em',
                    fontWeight: 500,
                    color: colors.textMuted,
                    whiteSpace: 'nowrap',
                  }}
                  >
                    · {displayRecordingDate}
                  </span>
                )}
              </span>
            </button>
          </div>
          {audioId && hasTranscription && (
            <div ref={downloadMenuRef} style={{ position: 'relative', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => {
                  if (isDownloading) return;
                  if (canDownloadJson) {
                    setDownloadMenuOpen((open) => !open);
                  } else {
                    handleDownload('txt');
                  }
                }}
                disabled={isDownloading}
                aria-haspopup={canDownloadJson ? 'menu' : undefined}
                aria-expanded={canDownloadJson ? downloadMenuOpen : undefined}
                aria-label="Скачать транскрипцию"
                title="Скачать"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '6px', border: '1px solid #d0d0d0',
                  backgroundColor: '#fff', color: '#333', fontSize: '13px', fontWeight: 600,
                  cursor: isDownloading ? 'wait' : 'pointer', fontFamily: 'inherit',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3v12" />
                  <path d="M7 10l5 5 5-5" />
                  <path d="M4 19h16" />
                </svg>
                {isDownloading ? 'Скачивание…' : 'Скачать'}
              </button>
              {canDownloadJson && downloadMenuOpen && (
                <div
                  role="menu"
                  style={{
                    position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 50,
                    minWidth: '200px', backgroundColor: '#fff', border: '1px solid #e0e0e0',
                    borderRadius: '10px', boxShadow: '0 6px 24px rgba(0,0,0,0.14)', overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '8px 14px 4px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#999' }}>
                    Формат
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleDownload('txt')}
                    style={menuItemStyle}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>.txt</span>
                    <span style={{ fontSize: '12px', color: '#777' }}>Текстовый файл</span>
                  </button>
                  <div style={{ height: '1px', backgroundColor: '#eee' }} />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleDownload('json')}
                    style={menuItemStyle}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>.json</span>
                    <span style={{ fontSize: '12px', color: '#777' }}>Структурированные данные</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {canEdit && hasWords && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: (helpOpen || selectionMode || canUndo) ? '10px' : 0,
          }}
          >
            <button
              type="button"
              disabled={busy}
              onClick={toggleSelectionMode}
              onMouseEnter={(e) => {
                if (busy || selectionMode) return;
                e.currentTarget.style.borderColor = '#93c5fd';
                e.currentTarget.style.boxShadow = '0 0 0 1px rgba(147, 197, 253, 0.45)';
              }}
              onMouseLeave={(e) => {
                if (selectionMode) return;
                e.currentTarget.style.borderColor = '#d0d0d0';
                e.currentTarget.style.boxShadow = 'none';
              }}
              style={{
                ...btnStyle(
                  selectionMode ? '#2563eb' : '#fff',
                  selectionMode ? '#fff' : '#333',
                  selectionMode ? '#2563eb' : '#d0d0d0',
                ),
                flexShrink: 0,
                whiteSpace: 'nowrap',
                transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
              }}
            >
              {selectionMode ? 'Готово' : 'Выделить несколько слов'}
            </button>

            {selectionMode && (
              <span style={{
                fontSize: '12px', color: '#2563eb', fontWeight: 500,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0,
              }}
              >
                {useTouchSelection ? 'Отмечайте касанием' : 'Отмечайте слова'}
              </span>
            )}

            <button
              type="button"
              onClick={() => setHelpOpen((open) => !open)}
              style={{
                marginLeft: 'auto',
                flexShrink: 0,
                background: 'none',
                border: 'none',
                padding: '4px 0',
                fontSize: '12px',
                fontWeight: 600,
                color: '#16a34a',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textDecoration: helpOpen ? 'none' : 'underline',
                textUnderlineOffset: '3px',
                whiteSpace: 'nowrap',
              }}
            >
              {helpOpen ? 'Скрыть подсказку' : 'Как редактировать?'}
            </button>
          </div>

          {canUndo && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '8px 12px',
              marginBottom: helpOpen ? '10px' : 0,
              backgroundColor: colors.page,
              border: `1px solid ${colors.borderStrong}`,
              borderRadius: radius.sm,
              fontSize: '13px',
            }}
            >
              <span style={{ color: colors.textMuted, lineHeight: 1.4 }}>
                Удаление можно отменить
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={undoDelete}
                style={{
                  flexShrink: 0,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#2563eb',
                  cursor: busy ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                  opacity: busy ? 0.6 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {busy ? 'Отмена…' : 'Отменить'}
              </button>
            </div>
          )}

          {helpOpen && <TranscriptionEditHelp showDesktopShortcuts={!useTouchSelection} />}
        </div>
      )}

      {canEdit && showBulkToolbar && (
        <BulkSelectionToolbar
          selectedCount={selectedCount}
          busy={busy}
          bulkLanguage={bulkLanguage}
          onBulkLanguageChange={setBulkLanguage}
          onApplyLanguage={applyBulkLanguage}
          bulkSpeakerId={bulkSpeakerId}
          bulkSpeakerLabel={bulkSpeakerLabel}
          onBulkSpeakerIdChange={(value) => {
            setBulkSpeakerId(value);
            if (value !== '__custom__') setBulkSpeakerLabel('');
          }}
          onBulkSpeakerLabelChange={setBulkSpeakerLabel}
          onApplySpeaker={applyBulkSpeaker}
          onDelete={bulkDeleteWords}
          onDismiss={selectionMode ? exitSelectionMode : clearSelection}
          dismissLabel={selectionMode ? 'Готово' : 'Снять выделение'}
          speakers={speakers}
          isNarrow={isNarrow}
        />
      )}

      {/* ================= WORDS (editable) ================= */}
      <div
        data-nav-highlight-transcription={highlightWordIndex != null ? 'true' : undefined}
        onMouseLeave={(e) => {
          if (highlightWordIndex == null) return;
          const next = e.relatedTarget;
          if (next?.closest?.('[data-nav-highlight-audio]')) return;
          onHighlightWordClear?.();
        }}
        style={{ lineHeight: '2.1', fontSize: '16px', textAlign: 'left', marginTop: '12px' }}
      >
        {hasWords ? (
          paragraphs.map((p, pIdx) => (
            <div key={pIdx} style={{ marginBottom: '18px', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
              <span style={{ position: 'relative', display: 'block', marginBottom: '6px', padding: 0 }}>
                <span
                  onClick={() => openSpeakerEditor(pIdx, p.speaker, p.items.map(({ gi }) => gi))}
                  title={canEdit ? 'Нажмите, чтобы сменить метку говорящего' : undefined}
                  style={speakerLabelStyle({
                    canEdit,
                    active: speakerEditor && speakerEditor.paragraphIdx === pIdx,
                  })}
                  onMouseEnter={(e) => {
                    if (canEdit && !(speakerEditor && speakerEditor.paragraphIdx === pIdx)) {
                      e.currentTarget.style.backgroundColor = '#f0fdf4';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!(speakerEditor && speakerEditor.paragraphIdx === pIdx)) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {p.speaker}:
                </span>
                {renderSpeakerPopover(pIdx, p.speaker)}
              </span>
              <p
                style={{
                  margin: 0,
                  padding: 0,
                  fontWeight: '500',
                  textAlign: 'left',
                  userSelect: canEdit ? 'none' : 'auto',
                  WebkitUserSelect: canEdit ? 'none' : 'auto',
                }}
                onMouseDown={(e) => {
                  if (canEdit && (e.shiftKey || selectionMode)) e.preventDefault();
                }}
              >
                {p.items.map(({ w, gi }, itemIdx) => {
                  const isSelected = selectedIndices.has(gi);
                  const isEditing = editor && editor.index === gi;
                  const isNavHighlighted = highlightWordIndex === gi;
                  return (
                  <React.Fragment key={gi}>
                    {itemIdx > 0 && ' '}
                    <span style={{ position: 'relative', display: 'inline' }}>
                      <span
                        ref={isNavHighlighted ? highlightWordRef : undefined}
                        onMouseDown={handleWordMouseDown}
                        onClick={(e) => handleWordClick(gi, e)}
                        title={canEdit
                          ? (selectionMode
                            ? 'Нажмите, чтобы отметить слово'
                            : 'Нажмите для правки')
                          : undefined}
                        style={{
                          color: langColor(w.lang),
                          cursor: canEdit ? 'pointer' : 'default',
                          borderRadius: '4px',
                          padding: canEdit || isNavHighlighted ? '1px 3px' : 0,
                          backgroundColor: isNavHighlighted
                            ? 'rgba(251, 191, 36, 0.45)'
                            : (isSelected ? 'rgba(37, 99, 235, 0.14)' : (isEditing ? '#eafaf1' : 'transparent')),
                          boxShadow: isNavHighlighted
                            ? 'inset 0 -3px 0 #f59e0b'
                            : (isSelected ? 'inset 0 -2px 0 #93c5fd' : 'none'),
                          outline: isNavHighlighted ? '2px solid #f59e0b' : 'none',
                          transition: 'background-color 0.1s ease, outline-color 0.1s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (canEdit && !isSelected && !isEditing && !isNavHighlighted) {
                            e.currentTarget.style.backgroundColor = '#f3f3f3';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (isNavHighlighted) {
                            const next = e.relatedTarget;
                            if (!next?.closest?.('[data-nav-highlight-audio]')) {
                              onHighlightWordClear?.();
                            }
                            return;
                          }
                          if (!isSelected && !isEditing) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {w.raw || w.text}
                      </span>
                      {renderPopover(gi)}
                    </span>
                  </React.Fragment>
                  );
                })}
              </p>
            </div>
          ))
        ) : sentences && sentences.length > 0 ? (
          sentences.map((sentence, sIdx) => (
            <div key={sIdx} style={{ marginBottom: '18px' }}>
              <div style={speakerLabelStyle()}>
                {sentence.speaker || UNASSIGNED_SPEAKER_LABEL}:
              </div>
              <p style={{ margin: 0, fontWeight: '500', color: '#333' }}>{sentence.text}</p>
            </div>
          ))
        ) : (
          <span style={{ color: '#333', fontWeight: '500' }}>{transcriptionText}</span>
        )}
      </div>
    </div>
  );
}

function HelpSection({ title, items }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{
        fontSize: '12px', fontWeight: 700, color: '#555', marginBottom: '6px',
        textTransform: 'uppercase', letterSpacing: '0.03em',
      }}
      >
        {title}
      </div>
      <ul style={{ margin: 0, padding: '0 0 0 18px', color: '#666', fontSize: '13px', lineHeight: 1.55 }}>
        {items.map((item) => <li key={item} style={{ marginBottom: '4px' }}>{item}</li>)}
      </ul>
    </div>
  );
}

function TranscriptionEditHelp({ showDesktopShortcuts }) {
  return (
    <div style={{
      padding: '14px 16px',
      backgroundColor: '#f8faf8',
      border: '1px solid #e8ece8',
      borderRadius: '10px',
    }}
    >
      <HelpSection
        title="Одно слово"
        items={[
          'Нажмите на слово в тексте — откроется окно правки',
          'Измените текст и язык, нажмите «Сохранить»',
          'Чтобы убрать слово — нажмите «Удалить» или очистите поле и сохраните',
          'Чтобы добавить новые слова — нажмите «+ добавить слово после» или напишите их через пробел',
        ]}
      />
      <HelpSection
        title="Несколько слов"
        items={[
          'Нажмите «Выделить несколько слов», отметьте нужные, затем смените язык, назначьте говорящего или удалите',
          ...(showDesktopShortcuts
            ? ['На компьютере: Ctrl+клик — добавить слово к выделению, Shift+клик — выделить диапазон (сначала кликните по начальному слову)']
            : ['На телефоне: касанием отмечайте слова в режиме выделения']),
          'Нажмите «Готово», чтобы вернуться к обычной правке',
        ]}
      />
      <HelpSection
        title="Говорящий"
        items={[
          'Нажмите на зелёное имя (например, «Мама:»), чтобы сменить метку во всей реплике или записи',
          'Для отдельных слов из разных реплик используйте выделение и «Назначить говорящего»',
        ]}
      />
      <HelpSection
        title="Аудиозапись"
        items={[
          'Нажмите на название над текстом — можно изменить название и дату записи',
        ]}
      />
      <HelpSection
        title="Отмена удаления"
        items={[
          'После удаления появится полоска «Удаление можно отменить»',
          'Нажмите «Отменить», чтобы вернуться к предыдущему состоянию (до 20 шагов)',
        ]}
      />
    </div>
  );
}

function BulkActionGroup({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        {children}
      </div>
    </div>
  );
}

function BulkSelectionToolbar({
  selectedCount,
  busy,
  bulkLanguage,
  onBulkLanguageChange,
  onApplyLanguage,
  bulkSpeakerId,
  bulkSpeakerLabel,
  onBulkSpeakerIdChange,
  onBulkSpeakerLabelChange,
  onApplySpeaker,
  onDelete,
  onDismiss,
  dismissLabel,
  speakers,
  isNarrow,
}) {
  const fieldStyle = {
    padding: '7px 10px',
    borderRadius: radius.sm,
    border: `1px solid ${colors.borderStrong}`,
    fontSize: '13px',
    backgroundColor: colors.surface,
    color: colors.textStrong,
    minWidth: 0,
    boxSizing: 'border-box',
  };

  const primaryBtn = {
    ...btnStyle(colors.primary, '#fff'),
    whiteSpace: 'nowrap',
  };

  const secondaryBtn = {
    ...btnStyle(colors.surface, colors.textMuted, colors.borderStrong),
    whiteSpace: 'nowrap',
  };

  const dangerBtn = {
    ...btnStyle(colors.surface, colors.danger, colors.dangerSoftBorder),
    whiteSpace: 'nowrap',
  };

  return (
    <div
      style={{
        marginBottom: '12px',
        padding: '14px',
        borderRadius: radius.lg,
        backgroundColor: '#f8fafc',
        border: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
      }}
      >
        <span style={{ fontSize: '14px', fontWeight: 700, color: colors.textStrong }}>
          Выбрано: {selectedCount}
        </span>
        <button type="button" disabled={busy} onClick={onDismiss} style={secondaryBtn}>
          {dismissLabel}
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr',
        gap: '12px',
      }}
      >
        <BulkActionGroup label="Язык">
          <SelectDropdown
            value={bulkLanguage}
            disabled={busy}
            onChange={onBulkLanguageChange}
            options={LANG_OPTIONS}
            ariaLabel="Язык для выделенных слов"
            style={{ flex: '1 1 140px', minWidth: 0 }}
            triggerStyle={{ fontSize: '13px', padding: '7px 10px', paddingRight: '30px' }}
          />
          <button type="button" disabled={busy} onClick={onApplyLanguage} style={primaryBtn}>
            Применить
          </button>
        </BulkActionGroup>

        <BulkActionGroup label="Говорящий">
          <SelectDropdown
            value={bulkSpeakerId}
            disabled={busy}
            onChange={onBulkSpeakerIdChange}
            placeholder="Выберите…"
            ariaLabel="Говорящий для выделенных слов"
            style={{ flex: '1 1 140px', minWidth: 0 }}
            triggerStyle={{ fontSize: '13px', padding: '7px 10px', paddingRight: '30px' }}
            options={[
              { value: '', label: 'Выберите…' },
              ...speakers.map((s) => ({
                value: String(s.id),
                label: `${s.label}${s.audio_count ? ` (${s.audio_count})` : ''}`,
              })),
              { value: '__custom__', label: 'Новая метка…' },
            ]}
          />
          {bulkSpeakerId === '__custom__' && (
            <input
              type="text"
              value={bulkSpeakerLabel}
              disabled={busy}
              onChange={(e) => onBulkSpeakerLabelChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onApplySpeaker(); }}
              placeholder="например, мама"
              style={{ ...fieldStyle, flex: '1 1 120px', width: isNarrow ? '100%' : '130px' }}
              aria-label="Новая метка говорящего"
            />
          )}
          <button type="button" disabled={busy} onClick={onApplySpeaker} style={primaryBtn}>
            Назначить
          </button>
        </BulkActionGroup>
      </div>

      <div style={{ borderTop: `1px solid ${colors.divider}`, paddingTop: '12px' }}>
        <button type="button" disabled={busy} onClick={onDelete} style={dangerBtn}>
          Удалить выбранные слова
        </button>
      </div>
    </div>
  );
}

function badgeStyle(bg) {
  return {
    width: '90px', padding: '3px 0', backgroundColor: bg, border: `1px solid ${bg}`,
    borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', color: '#ffffff',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  };
}

function btnStyle(bg, color, border) {
  return {
    backgroundColor: bg, color, border: `1px solid ${border || bg}`,
    padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  };
}

const menuItemStyle = {
  width: '100%',
  padding: '10px 14px',
  backgroundColor: 'transparent',
  border: 'none',
  textAlign: 'left',
  cursor: 'pointer',
  fontFamily: 'inherit',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

export default TranscriptionBox;
