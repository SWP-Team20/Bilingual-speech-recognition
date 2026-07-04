import React, { useState } from 'react';
import { audioApi } from '../api/audioApi';
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
  // editor: { mode: 'edit' | 'add', index, raw, language } | null
  const [editor, setEditor] = useState(null);
  const [busy, setBusy] = useState(false);

  const words = transcriptionWords || [];
  const counts = countLangs(words);

  const openEditor = (index) => {
    if (!canEdit || busy) return;
    const w = words[index];
    setEditor({ mode: 'edit', index, raw: w.raw ?? w.text ?? '', language: w.lang || 'unknown' });
  };
  const openAddAfter = (index) => setEditor({ mode: 'add', index, raw: '', language: 'unknown' });
  const closeEditor = () => { if (!busy) setEditor(null); };

  const applyResult = (data) => {
    if (data && Array.isArray(data.words)) onWordsChanged?.(data.words);
  };

  const saveEdit = async () => {
    const raw = editor.raw.trim();
    if (!raw) { toast.error('Слово не может быть пустым'); return; }
    setBusy(true);
    try {
      const data = await audioApi.editTranscriptionWord(audioId, editor.index, {
        raw, language: editor.language,
      });
      applyResult(data);
      toast.success('Слово обновлено');
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
      toast.success('Слово добавлено');
      setEditor(null);
    } catch (e) {
      console.error(e);
      toast.error('Не удалось добавить слово');
    } finally { setBusy(false); }
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
          textAlign: 'left', cursor: 'default', fontWeight: 400,
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
          placeholder="Слово"
          style={{
            width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: '14px',
            border: '1px solid #d0d0d0', borderRadius: '6px', outline: 'none', marginBottom: '8px',
          }}
        />
        <select
          value={editor.language}
          disabled={busy}
          onChange={(e) => setEditor((s) => ({ ...s, language: e.target.value }))}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: '14px',
            border: '1px solid #d0d0d0', borderRadius: '6px', outline: 'none', marginBottom: '10px',
            backgroundColor: '#fff', cursor: 'pointer',
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

  return (
    <div style={{
      backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e6e6e6',
      height: 'fit-content', boxSizing: 'border-box', width: '100%', boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
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

      {/* ================= AUDIO FILE NAME LABEL ================= */}
      {audioName && (
        <div style={{
          fontSize: '15px', fontWeight: '700', color: '#555', textAlign: 'left',
          marginTop: '20px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px dashed #eee',
        }}>
          {audioName}
        </div>
      )}

      {canEdit && hasWords && (
        <div style={{ fontSize: '12px', color: '#999', marginBottom: '10px' }}>
          Нажмите на слово, чтобы изменить его или язык.
        </div>
      )}

      {/* ================= WORDS (editable) ================= */}
      <div style={{ lineHeight: '2.1', fontSize: '16px', textAlign: 'left', marginTop: '12px' }}>
        {hasWords ? (
          groupBySpeaker(words).map((p, pIdx) => (
            <div key={pIdx} style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 'bold', color: '#16a34a', fontSize: '14px', marginBottom: '2px' }}>
                {p.speaker}:
              </span>
              <p style={{ margin: 0, fontWeight: '500' }}>
                {p.items.map(({ w, gi }) => (
                  <span key={gi} style={{ position: 'relative', display: 'inline-block' }}>
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
                    {' '}
                  </span>
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

export default TranscriptionBox;
