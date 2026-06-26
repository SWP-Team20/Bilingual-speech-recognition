# Схема БД — справка для команды

Шпаргалка: какие таблицы, поля и как они заполняются на одну запись. Фильтры
поиска: **дата · слово · говорящий · язык**. SQLAlchemy-модели — `backend/src/models.py`.

## Принцип хранения
- **Диск** `storage/<audio_id>/`: `original_16k.wav`, `processed.wav`,
  `transcription.json`, `transcription.txt`. ← тяжёлые артефакты.
- **Postgres**: метаданные + метрики + индекс слов + говорящие. ← по чему ищем/фильтруем.

## Схема (ER, текстом)
```
audio_files (1) ──< words >── (1) speakers
      │  (1)
      ├──< word_counts
      └──< speech_segments
```
`words.audio_id → audio_files.id`, `words.speaker_id → speakers.id` (nullable),
`word_counts.audio_id → audio_files.id`, `speech_segments.audio_id → audio_files.id`.

## Таблицы и поля

### `audio_files` — одна строка на запись
| поле | тип | null | индекс | смысл |
|---|---|---|---|---|
| id | UUID | нет | PK | идентификатор записи |
| filename | text | да | да | имя загруженного файла |
| content_type | text | да | | mime (audio/mpeg…) |
| uploaded_at | timestamp | да | | когда загрузили |
| **recorded_at** | timestamp | да | **да** | **дата записи — фильтр по дате** |
| folder_path | text | нет | | путь к `storage/<id>/` |
| status | text | да | | queued/processing/done/error |
| primary_language | text | да | | доминирующий язык (ru/tt) |
| duration_sec | float | да | | длительность оригинала |
| speech_sec | float | да | | чистая речь (без пауз) |
| silence_removed_sec | float | да | | вырезано тишины |
| total_words | int | да | | всего слов |
| unique_words | int | да | | уникальных слов |
| words_per_minute | float | да | | темп речи |
| ru_words / tt_words / unknown_words | int | да | | разбивка по языку |
| avg_confidence | float | да | | средняя уверенность ASR |

### `words` — одна строка на слово (ядро поиска, «bag of words»)
| поле | тип | null | индекс | смысл |
|---|---|---|---|---|
| id | int | нет | PK | |
| audio_id | UUID | нет | да (FK) | к какой записи |
| **text** | text | да | **да** | нормализованное слово — **фильтр по слову** |
| raw | text | да | | форма ASR (регистр/пунктуация) — для показа |
| start_sec | float | да | | начало слова (сек, оригинал) |
| end_sec | float | да | | конец слова |
| **language** | text | да | **да** | ru/tt/unknown — **фильтр по языку** |
| confidence | float | да | | уверенность (tt может быть NULL) |
| position | int | да | | порядковый номер слова в записи |
| **speaker_id** | int | да | **да (FK)** | кто сказал — **фильтр по говорящему** (NULL до диаризации) |

### `speakers` — говорящие (мама/папа), глобально по корпусу
| поле | тип | null | индекс | смысл |
|---|---|---|---|---|
| id | int | нет | PK | |
| label | text | да | да | 'мама'/'папа'/'ребёнок' |
| created_at | timestamp | да | | |

### `word_counts` — частота слова в пределах записи (статистика/топ-слова)
| поле | тип | смысл |
|---|---|---|
| id | int PK | |
| audio_id | UUID FK | |
| text | text idx | слово |
| language | text idx | язык |
| count | int | сколько раз в этой записи |

### `speech_segments` — карта VAD orig↔trim (для плеера)
| поле | тип | смысл |
|---|---|---|
| id | int PK | |
| audio_id | UUID FK | |
| orig_start / orig_end | float | координаты оригинала |
| trim_start / trim_end | float | координаты обрезанного файла |

## DDL-шаблон (для тех, кто пишет голый SQL)
```sql
CREATE TABLE audio_files (
  id UUID PRIMARY KEY,
  filename TEXT, content_type TEXT,
  uploaded_at TIMESTAMP, recorded_at TIMESTAMP,
  folder_path TEXT NOT NULL, status TEXT, primary_language TEXT,
  duration_sec REAL, speech_sec REAL, silence_removed_sec REAL,
  total_words INT, unique_words INT, words_per_minute REAL,
  ru_words INT, tt_words INT, unknown_words INT, avg_confidence REAL
);
CREATE INDEX ix_audio_recorded_at ON audio_files (recorded_at);

CREATE TABLE speakers (
  id SERIAL PRIMARY KEY, label TEXT, created_at TIMESTAMP
);
CREATE INDEX ix_speakers_label ON speakers (label);

CREATE TABLE words (
  id SERIAL PRIMARY KEY,
  audio_id UUID REFERENCES audio_files(id) ON DELETE CASCADE,
  text TEXT, raw TEXT, start_sec REAL, end_sec REAL,
  language TEXT, confidence REAL, position INT,
  speaker_id INT REFERENCES speakers(id) ON DELETE SET NULL
);
CREATE INDEX ix_words_text ON words (text);
CREATE INDEX ix_words_language ON words (language);
CREATE INDEX ix_words_speaker ON words (speaker_id);
CREATE INDEX ix_words_text_lang ON words (text, language);
-- нечёткий поиск по слову (татарская ASR ошибается в орфографии):
-- CREATE EXTENSION pg_trgm;  CREATE INDEX ix_words_text_trgm ON words USING gin (text gin_trgm_ops);

CREATE TABLE word_counts (
  id SERIAL PRIMARY KEY,
  audio_id UUID REFERENCES audio_files(id) ON DELETE CASCADE,
  text TEXT, language TEXT, count INT
);
CREATE TABLE speech_segments (
  id SERIAL PRIMARY KEY,
  audio_id UUID REFERENCES audio_files(id) ON DELETE CASCADE,
  orig_start REAL, orig_end REAL, trim_start REAL, trim_end REAL
);
```

## Сквозной пример (одна запись)

Файл `kuhnya_20_06.mp3`, фраза «…станция… Җиңү проспекты…».

`audio_files`:
```
id=3f2b8c10-...  filename=kuhnya_20_06.mp3  recorded_at=2026-06-20 18:30
folder_path=storage/3f2b8c10-.../  status=done  primary_language=ru
duration_sec=41.05 speech_sec=33.2 total_words=27 unique_words=24
words_per_minute=39.5 ru_words=20 tt_words=7 unknown_words=0 avg_confidence=0.88
```
`speakers`:
```
id=1 label=мама    id=2 label=папа
```
`words` (фрагмент):
```
audio_id          text       raw        start  end   language conf  position speaker_id
3f2b8c10-...       станция    станция,   4.12   4.63  ru       0.91  5        1
3f2b8c10-...       җиңү       Җиңү       9.10   9.55  tt       NULL  12       2
3f2b8c10-...       проспекты  проспекты  9.55   10.1  ru       0.87  13       2
```
`word_counts`:
```
audio_id          text       language count
3f2b8c10-...       станция    ru       3
3f2b8c10-...       җиңү       tt       1
```
`speech_segments`:
```
audio_id          orig_start orig_end trim_start trim_end
3f2b8c10-...       0.0        1.7      0.0        1.7
3f2b8c10-...       3.7        6.7      1.7        4.7
```

## Шаблон transcription.json (на диске)
```jsonc
{
  "audio_id": "3f2b8c10-...",
  "filename": "kuhnya_20_06.mp3",
  "recorded_at": "2026-06-20T18:30:00",
  "engine": "VAD + MMS-LID + Whisper-large-v3(ru) / Whisper-TT(tt)",
  "stats": { "total_sec": 41.05, "speech_sec": 33.2, "silence_removed_sec": 7.85,
             "trim_ratio": 0.809, "n_segments": 8 },
  "segment_map": [ {"orig_start":0.0,"orig_end":1.7,"trim_start":0.0,"trim_end":1.7} ],
  "words": [
    {"text":"станция","raw":"станция,","start":4.12,"end":4.63,"conf":0.91,"lang":"ru","seg_lang":"ru","speaker":"мама"},
    {"text":"җиңү","raw":"Җиңү","start":9.10,"end":9.55,"conf":null,"lang":"tt","seg_lang":"tt","speaker":"папа"}
  ]
}
```
`transcription.txt` — те же слова через пробел: `... станция җиңү проспекты ...`

## Шаблоны запросов (фильтры дата · слово · говорящий · язык)
```sql
-- поиск слова с любым набором фильтров (любой из параметров может быть NULL)
SELECT a.id, a.filename, a.recorded_at, w.text, w.start_sec, w.language, s.label AS speaker
FROM words w
JOIN audio_files a ON a.id = w.audio_id
LEFT JOIN speakers s ON s.id = w.speaker_id
WHERE (:word    IS NULL OR w.text = :word)
  AND (:lang    IS NULL OR w.language = :lang)
  AND (:speaker IS NULL OR s.label = :speaker)
  AND (:from    IS NULL OR a.recorded_at >= :from)
  AND (:to      IS NULL OR a.recorded_at <  :to)
ORDER BY a.recorded_at DESC, w.position;

-- говорящие в конкретной записи
SELECT DISTINCT s.label FROM words w JOIN speakers s ON s.id=w.speaker_id WHERE w.audio_id=:id;

-- топ слов записи
SELECT text, language, count FROM word_counts WHERE audio_id=:id ORDER BY count DESC LIMIT 20;
```

## Что ещё не заполняется (TODO в пайплайне)
- `recorded_at` — прокинуть из формы загрузки.
- `speaker_id` / `speakers` — нужен шаг **диаризации** (кто говорит); до него NULL.
Остальное (`words`, метрики, `word_counts`, `speech_segments`) пишется в
`db_index.save_transcription` уже сейчас.
