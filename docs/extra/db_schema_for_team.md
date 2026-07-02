# Схема БД — справка для команды

## Принцип хранения

Тяжёлые артефакты лежат на диске в storage/<audio_id>/:
- загруженный оригинал — `original<ext>`,
- нормализованный оригинал 16 кГц — `original_16k.wav`,
- обрезанное аудио — `processed.wav`,
- транскрипция — `transcription.json` и `transcription.txt`.

В Postgres — метаданные, метрики, индекс слов, говорящие и пользователи (авторизация).

Фильтры поиска по корпусу:
- дата,
- слово (несколько — AND),
- говорящий,
- язык (несколько — AND),
- статус обработки.

## Таблица users

Пользователи и роли (авторизация, не связана с говорящими в транскриптах).

Поля:
- id (UUID, ключ),
- username (уникальный),
- hashed_password,
- role (`user` / `manager` / `admin`),
- created_at.

Роли:
- **user** — просмотр и поиск;
- **manager** / **admin** — загрузка, редактирование, удаление аудио.

## Таблица audio_files

Одна строка на запись.

Поля:
- id (UUID, ключ),
- filename (отображаемое название; уникально без учёта регистра),
- content_type,
- uploaded_at,
- recorded_at (дата записи — фильтр по дате, индекс; задаётся при загрузке),
- folder_path (путь к папке storage/<id>/),
- status (`processing_audio` → `processing_text` → `done` / `error`),
- primary_language,
- duration_sec,
- speech_sec,
- silence_removed_sec,
- total_words,
- unique_words,
- words_per_minute,
- ru_words,
- tt_words,
- unknown_words,
- avg_confidence.

## Таблица words

Одна строка на слово — это ядро поиска (мешок слов).

Поля:
- id,
- audio_id (к какой записи),
- text (нормализованное слово — фильтр по слову, индекс),
- raw (форма ASR с регистром и пунктуацией, для показа),
- start_sec и end_sec (таймкоды в координатах оригинала),
- language (ru/tt/unknown — фильтр по языку, индекс),
- confidence (у татарских может быть пусто),
- position (порядковый номер слова),
- speaker_id (кто сказал — фильтр по говорящему; заполняется диаризацией).

## Таблица speakers

Говорящие, глобально по корпусу.

Поля:
- id,
- label (`Говорящий 1`, `Говорящий 2`… или переименованные мама/папа/ребёнок),
- created_at.

Список говорящих в записи берётся как уникальные speaker_id у её слов.

## Таблица word_counts

Частота слова в пределах одной записи (для статистики и топ-слов).

Поля:
- id,
- audio_id,
- text,
- language,
- count.

## Таблица speech_segments

Карта VAD для плеера: соответствие координат оригинала и обрезанного файла.

Поля:
- id,
- audio_id,
- orig_start,
- orig_end,
- trim_start,
- trim_end.

## Транскрипт на диске

transcription.json содержит:
- audio_id,
- filename,
- recorded_at (если задана),
- timeline (`original`),
- engine,
- блок stats с длительностями,
- segment_map с картой VAD,
- sentences (реплики: speaker, lang, text, words),
- массив words.

Каждое слово:
- text,
- raw,
- start,
- end,
- conf,
- lang,
- seg_lang,
- speaker.

transcription.txt — реплики построчно: `Говорящий N: текст`.

## API: как доставать данные

Бэкенд FastAPI, префикс `/api/v1`. Все эндпоинты аудио требуют JWT
(кроме `POST /auth/login`).

### Авторизация (`backend/src/routers/auth.py`)
- Вход — `POST /auth/login` (form: username, password) → bearer token.
- Профиль — `GET /auth/me`.
- Смена пароля — `POST /auth/change-password`.
- Удаление своего аккаунта — `DELETE /auth/me`.

### Аудио и транскрипции (`backend/src/routers/audio.py`)

**Все роли (user, manager, admin):**
- Список записей с фильтрами — `GET /audio/` (`q`, `lang`, `speaker`, `date_from`, `date_to`, `status`).
- Поиск по названию — `GET /audio/by-filename?filename=...`.
- Статус обработки — `GET /audio/{id}/status`.
- Размеры файлов записи — `GET /audio/{id}/sizes`.
- Общий объём storage — `GET /audio/storage/total`.
- Поиск по корпусу — `GET /search/` (те же фильтры; возвращает вхождения с `start_sec`).
- Список транскриптов — `GET /transcriptions/`.
- Полный транскрипт — `GET /transcriptions/{id}` (words + sentences).
- Оригинал — `GET /audio/{id}?type=original`.
- Обрезанное — `GET /audio/{id}?type=processed`.
- Нормализованный 16 кГц — `GET /audio/{id}?type=original_16k`.

**Только manager / admin:**
- Загрузка — `POST /upload-audio/` (file, опц. `title`, `recorded_at`) → 202, фоновая обработка.
- Правка метаданных — `PATCH /audio/{id}` (title, recorded_at).
- Замена обрезанного файла — `PATCH /audio/{id}/processed`.
- Редактирование текста — `PATCH /transcriptions/{id}`.
- Удаление — `DELETE /audio/{id}`.

### Админка пользователей (`backend/src/routers/admin.py`, только admin)
- Список — `GET /users/`.
- Создание — `POST /users/`.
- Смена роли — `PATCH /users/{id}/role`.
- Сброс пароля — `PATCH /users/{id}/reset-password`.
- Удаление — `DELETE /users/{id}`.

## Обрезанное аудио

Хранится как `processed.wav` в папке записи, отдельной колонки под путь нет:
путь = `folder_path` + имя файла. Скачивается ручкой `type=processed`.

## Нужно ли что-то добавлять в БД

Для фильтров дата, слово, говорящий, язык, статус схема достаточна.
Диаризация и индексация слов работают в проде (`db_index.save_transcription`).
Метки говорящих «Говорящий N» можно переименовать в мама/папа через UI/БД
(update строки в `speakers`).
