import React, { useEffect, useRef, useState } from 'react';
import { audioApi } from '../api/audioApi';
import { speakersApi } from '../api/speakersApi';
import { useToast } from './ui/toastContext';

const LANG_OPTIONS = [
  { value: 'ru', label: 'Русский' },
  { value: 'tt', label: 'Татарский' },
  { value: 'unknown', label: 'Другой' },
];

// Цвет слова по языку: татарский — зелёный, «другой» — серый, русский — тёмный.
const langColor = (lang) => (lang === 'tt' ? '#009a55' : lang === 'unknown' ? '#9a9a9a' : '#333');

// Группировка плоского массива слов в реплики по смене говорящего.
// Сохраняем ГЛОБАЛЬНЫЙ индекс каждого слова (== position в БД) — он нужен для правки.
function groupBySpeaker(words) {
  const paragraphs = [];
  let cur = null;
  words.forEach((w, gi) => {
    const speaker = w.speaker || 'Говорящий';
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
  canEdit = false,
  onWordsChanged,
}) {
  const toast = useToast();
  const downloadMenuRef = useRef(null);
  // editor: { mode: 'edit' | 'add', index, raw, language } | null
  const [editor, setEditor] = useState(null);
  // speakerEditor: { paragraphIdx, currentLabel, selectedId, customLabel, mode: 'existing' | 'custom' } | null
  const [speakerEditor, setSpeakerEditor] = useState(null);
  const [speakers, setSpeakers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  const isDownloading = downloadingFormat !== null;

  const words = transcriptionWords || [];
  const counts = countLangs(words);

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
    setBusy(true);
    try {
      const data = await audioApi.deleteTranscriptionWord(audioId, editor.index);
      applyResult(data);
      toast.success('Слово удалено');
      setEditor(null);
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
        <select
          value={speakerEditor.selectedId}
          disabled={busy || speakerEditor.mode !== 'existing'}
          onChange={(e) => setSpeakerEditor((s) => ({ ...s, selectedId: e.target.value, mode: 'existing' }))}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: '14px',
            border: '1px solid #d0d0d0', borderRadius: '6px', outline: 'none', marginBottom: '10px',
            backgroundColor: speakerEditor.mode === 'existing' ? '#fff' : '#f7f7f7',
            color: '#333',
            cursor: speakerEditor.mode === 'existing' ? 'pointer' : 'default',
          }}
        >
          <option value="">— выберите —</option>
          {otherSpeakers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}{s.audio_count ? ` (${s.audio_count})` : ''}
            </option>
          ))}
        </select>

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
          placeholder={isAdd ? 'Слово или несколько через пробел' : 'Слово (пустое = удалить)'}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: '14px',
            border: '1px solid #d0d0d0', borderRadius: '6px', outline: 'none', marginBottom: '8px',
            color: '#333', backgroundColor: '#fff',
          }}
        />
        <select
          value={editor.language}
          disabled={busy}
          onChange={(e) => setEditor((s) => ({ ...s, language: e.target.value }))}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: '14px',
            border: '1px solid #d0d0d0', borderRadius: '6px', outline: 'none', marginBottom: '10px',
            backgroundColor: '#fff', color: '#333', cursor: 'pointer',
          }}
        >
          {LANG_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

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

  return (
    <div style={{
      backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e6e6e6',
      height: 'fit-content', boxSizing: 'border-box', width: '100%', boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      color: '#333',
    }}>
      {/* ================= LANGUAGE BADGES + LIVE COUNTS ================= */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', width: '100%', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={badgeStyle('#000000')}>Русский</div>
        <div style={badgeStyle('#009a55')}>Татарский</div>
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
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#555', textAlign: 'left', minWidth: 0 }}>
            {audioName}
          </div>
          {audioId && hasTranscription && (
            <div ref={downloadMenuRef} style={{ position: 'relative', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => { if (!isDownloading) setDownloadMenuOpen((open) => !open); }}
                disabled={isDownloading}
                aria-haspopup="menu"
                aria-expanded={downloadMenuOpen}
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
              {downloadMenuOpen && (
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
        <div style={{ fontSize: '12px', color: '#999', marginBottom: '10px' }}>
          Нажмите на слово, чтобы изменить его или язык. Несколько слов через пробел разбиваются;
          пустое поле или «Удалить» — убирает слово. Нажмите на имя говорящего, чтобы сменить метку.
        </div>
      )}

      {/* ================= WORDS (editable) ================= */}
      <div style={{ lineHeight: '2.1', fontSize: '16px', textAlign: 'left', marginTop: '12px' }}>
        {hasWords ? (
          groupBySpeaker(words).map((p, pIdx) => (
            <div key={pIdx} style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column' }}>
              <span style={{ position: 'relative', display: 'inline-block', marginBottom: '2px' }}>
                <span
                  onClick={() => openSpeakerEditor(pIdx, p.speaker, p.items.map(({ gi }) => gi))}
                  title={canEdit ? 'Изменить метку говорящего' : undefined}
                  style={{
                    fontWeight: 'bold', color: '#16a34a', fontSize: '14px',
                    cursor: canEdit ? 'pointer' : 'default',
                    borderRadius: '4px',
                    padding: canEdit ? '1px 4px' : 0,
                    backgroundColor: speakerEditor && speakerEditor.paragraphIdx === pIdx ? '#eafaf1' : 'transparent',
                    outline: canEdit ? '1px dashed transparent' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (canEdit && !(speakerEditor && speakerEditor.paragraphIdx === pIdx)) {
                      e.currentTarget.style.backgroundColor = '#f3f3f3';
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
              <p style={{ margin: 0, fontWeight: '500' }}>
                {p.items.map(({ w, gi }, itemIdx) => (
                  <React.Fragment key={gi}>
                    {itemIdx > 0 && ' '}
                    <span style={{ position: 'relative', display: 'inline-block' }}>
                      <span
                        onClick={() => openEditor(gi)}
                        title={canEdit ? 'Изменить слово' : undefined}
                        style={{
                          color: langColor(w.lang),
                          cursor: canEdit ? 'pointer' : 'default',
                          borderRadius: '4px',
                          padding: canEdit ? '1px 3px' : 0,
                          backgroundColor: editor && editor.index === gi ? '#eafaf1' : 'transparent',
                          outline: canEdit ? '1px dashed transparent' : 'none',
                          transition: 'background-color 0.1s ease',
                        }}
                        onMouseEnter={(e) => { if (canEdit && !(editor && editor.index === gi)) e.currentTarget.style.backgroundColor = '#f3f3f3'; }}
                        onMouseLeave={(e) => { if (!(editor && editor.index === gi)) e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        {w.raw || w.text}
                      </span>
                      {renderPopover(gi)}
                    </span>
                  </React.Fragment>
                ))}
              </p>
            </div>
          ))
        ) : sentences && sentences.length > 0 ? (
          sentences.map((sentence, sIdx) => (
            <div key={sIdx} style={{ marginBottom: '14px' }}>
              <span style={{ fontWeight: 'bold', color: '#16a34a', fontSize: '14px' }}>
                {sentence.speaker || 'Неизвестный говорящий'}:
              </span>
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
