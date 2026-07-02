# Схема хранения и поиска (ru/tt корпус)

Что храним от каждой записи, как выглядят транскрипции, какие поля в Postgres.
Фильтры поиска: **дата · слово · говорящий · язык · статус** (без эмбеддингов).
Несколько слов/языков в одном запросе комбинируются через **AND** на уровне записи
(запись должна содержать все указанные слова и все указанные языки).

## 1. Где что лежит (диск + Postgres)

Полные транскрипты в Postgres не храним. Раздельно:

| Данные | Где |
|---|---|
| `original<ext>` (загруженный файл), `original_16k.wav`, `processed.wav` (без пауз) | диск `storage/<audio_id>/` |
| `transcription.json` (слова, реплики, таймкоды/теги), `transcription.txt` (реплики построчно) | диск `storage/<audio_id>/` |
| метаданные, метрики, индекс слов, говорящие | **Postgres** |

Postgres = индекс/метрики/фильтры; диск = тяжёлые файлы.

## 2. Как выглядят транскрипции

### transcription.json (источник правды)
```jsonc
{
  "audio_id": "3f2b8c10-...-e91",
  "filename": "kuhnya_20_06.mp3",
  "recorded_at": "2026-06-20T18:30:00",
  "timeline": "original",
  "engine": "VAD + MMS-LID + Whisper-large-v3(ru) / Whisper-TT(tt)",
  "stats": { "total_sec": 41.05, "speech_sec": 33.2, "silence_removed_sec": 7.85,
             "trim_ratio": 0.809, "n_segments": 8 },
  "segment_map": [
    { "orig_start": 0.0, "orig_end": 1.7, "trim_start": 0.0, "trim_end": 1.7 }
  ],
  "sentences": [
    { "speaker": "Говорящий 1", "lang": "ru", "start": 4.12, "end": 9.55,
      "text": "станция, Җиңү", "words": [
        { "raw": "станция,", "text": "станция", "lang": "ru" },
        { "raw": "Җиңү", "text": "җиңү", "lang": "tt" }
      ]}
  ],
  "words": [
    { "text": "станция", "raw": "станция,", "start": 4.12, "end": 4.63,
      "conf": 0.91, "lang": "ru", "seg_lang": "ru", "speaker": "Говорящий 1" },
    { "text": "җиңү", "raw": "Җиңү", "start": 9.10, "end": 9.55,
      "conf": null, "lang": "tt", "seg_lang": "tt", "speaker": "Говорящий 2" }
  ]
}
```
Поле слова | смысл
---|---
`text` | нормализованное (lower, только буквы) — **по нему ищем**
`raw` | как выдала ASR (регистр/пунктуация) — для показа
`start`,`end` | секунды в координатах ОРИГИНАЛА — прыжок в плеере
`conf` | уверенность (у tt из Whisper-TT может быть `null`)
`lang` | `ru` / `tt` / `unknown`
`seg_lang` | решение аудио-LID для сегмента
`speaker` | `Говорящий N` / … (диаризация); `null` если выкл. или не удалось

### transcription.txt
Реплики построчно с префиксом говорящего (если есть):
```
Говорящий 1: братан срочно как будет на татарском покрывало
Говорящий 2: япма ...
```

## 3. Схема Postgres (что хранится на запись)

### `audio_files` — одна строка на запись (метаданные + метрики)
| поле | тип | смысл |
|---|---|---|
| id | UUID PK | идентификатор |
| filename | str | имя файла |
| content_type | str | mime |
| uploaded_at | datetime | когда загрузили |
| **recorded_at** | datetime, idx | **дата записи — фильтр по дате** |
| folder_path | str | путь к `storage/<id>/` |
| status | str | `processing_audio` / `processing_text` / `done` / `error` |
| primary_language | str | доминирующий язык записи |
| duration_sec, speech_sec, silence_removed_sec | float | длительности |
| total_words, unique_words | int | кол-во слов / уникальных |
| words_per_minute | float | темп речи |
| ru_words, tt_words, unknown_words | int | разбивка по языку |
| avg_confidence | float | средняя уверенность |

### `words` — одна строка на слово («мешок слов», ядро поиска)
| поле | тип | смысл |
|---|---|---|
| id | int PK | |
| audio_id | UUID FK→audio_files | к какой записи |
| **text** | str, idx | нормализованное слово — **фильтр по слову** |
| raw | str | форма ASR (для показа) |
| start_sec, end_sec | float | таймкоды (оригинал) |
| **language** | str, idx | ru/tt/unknown — **фильтр по языку** |
| confidence | float | уверенность |
| position | int | порядковый номер в аудио |
| **speaker_id** | int FK→speakers, idx | **фильтр по говорящему** (заполняется диаризацией) |

### `speakers` — говорящие (мама/папа), глобально по корпусу
| поле | тип | смысл |
|---|---|---|
| id | int PK | |
| label | str, idx | `мама`/`папа`/… |
| created_at | datetime | |

«Список говорящих в записи» = `SELECT DISTINCT speaker_id FROM words WHERE audio_id=?`.

### `word_counts` — частоты слова в пределах аудио (для статистики/топ-слов)
`id, audio_id, text, language, count`.

### `speech_segments` — карта VAD (для плеера orig↔trim)
`id, audio_id, orig_start, orig_end, trim_start, trim_end`.

Индексы под фильтры: `audio_files.recorded_at`, `words.text`, `words.language`,
`words.speaker_id`, составной `ix_words_text_lang (text, language)`.
Для нечёткого поиска по слову (татарская ASR ошибается в орфографии) — опционально
`pg_trgm` + GIN на `words.text`.

## 4. Поиск по фильтрам (дата · слово · говорящий · язык · статус)

Реализация: `backend/src/services/audio_filter.py` (общий `CorpusFilters` для
`GET /search/`, `GET /audio/`, `GET /transcriptions/`).

```sql
SELECT a.id, a.filename, a.recorded_at, w.text, w.start_sec,
       w.language, s.label AS speaker
FROM words w
JOIN audio_files a ON a.id = w.audio_id
LEFT JOIN speakers s ON s.id = w.speaker_id
WHERE (:word     IS NULL OR w.text = :word)              -- слово (можно несколько, AND)
  AND (:lang     IS NULL OR w.language = :lang)          -- язык ru/tt (можно несколько, AND)
  AND (:speaker  IS NULL OR s.label = :speaker)          -- говорящий
  AND (:from     IS NULL OR a.recorded_at >= :from)      -- дата с
  AND (:to       IS NULL OR a.recorded_at <  :to)        -- дата по (включительно)
  AND (:status   IS NULL OR a.status = :status)          -- статус обработки
ORDER BY a.recorded_at DESC, w.position;
```
Выдача сразу содержит `start_sec` → переход к месту слова в записи.

Параметры API: `q` (слово, повторяемый или через запятую), `lang`, `speaker`,
`date_from` / `date_to`, `status`. Все эндпоинты требуют JWT (`/api/v1/auth/login`).

## 5. Статус реализации

- `recorded_at` — задаётся при загрузке (`title` + `recorded_at` в `POST /upload-audio/`)
  или правится через `PATCH /audio/{id}`.
- `speaker_id` — заполняется шагом диаризации (ECAPA); метки «Говорящий N» можно
  переименовать в `speakers.label`.
- Слова, метрики, частоты, сегменты, говорящие пишутся в `db_index.save_transcription`.
