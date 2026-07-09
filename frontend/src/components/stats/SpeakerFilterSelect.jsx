import { useEffect, useState } from 'react';
import { speakersApi } from '../../api/speakersApi';
import { colors } from '../../theme';

/**
 * Dropdown of existing corpus speakers for stats/audio filters.
 * Empty value = no speaker filter (all speakers).
 */
function SpeakerFilterSelect({ value = '', onChange, style, disabled = false }) {
  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await speakersApi.listSpeakers();
        if (!cancelled) setSpeakers(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
        if (!cancelled) setSpeakers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const labels = speakers.map((s) => s.label).filter(Boolean);
  const current = value || '';
  const hasCurrent = current && !labels.includes(current);

  return (
    <>
      <select
        value={current}
        disabled={disabled || loading}
        onChange={(e) => onChange?.(e.target.value)}
        aria-label="Говорящий"
        style={style}
      >
        <option value="">{loading ? 'Загрузка…' : 'Все говорящие'}</option>
        {hasCurrent && <option value={current}>{current}</option>}
        {speakers.map((s) => (
          <option key={s.id} value={s.label}>
            {s.label}{s.audio_count ? ` (${s.audio_count})` : ''}
          </option>
        ))}
      </select>
      <div style={{ marginTop: '6px', fontSize: '12px', color: colors.textFaint, lineHeight: 1.4 }}>
        Выберите говорящего из списка. Пустое значение — все говорящие.
      </div>
    </>
  );
}

export default SpeakerFilterSelect;
