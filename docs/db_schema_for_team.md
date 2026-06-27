Схема БД — справка для команды

Принцип хранения

Тяжёлые артефакты лежат на диске в storage/<audio_id>/: оригинал original<ext>, обрезанное аудио processed.wav, транскрипт transcription.json и transcription.txt. В Postgres — только метаданные, метрики, индекс слов и говорящие, то есть то, по чему ищем и фильтруем. Фильтры поиска: дата, слово, говорящий, язык.

Таблица audio_files

Одна строка на запись. Поля: id (UUID, ключ), filename, content_type, uploaded_at, recorded_at (дата записи — фильтр по дате, индекс), folder_path (путь к папке storage/<id>/), status, primary_language, duration_sec, speech_sec, silence_removed_sec, total_words, unique_words, words_per_minute, ru_words, tt_words, unknown_words, avg_confidence.

Таблица words

Одна строка на слово — это ядро поиска (мешок слов). Поля: id, audio_id (к какой записи), text (нормализованное слово — фильтр по слову, индекс), raw (форма ASR с регистром и пунктуацией, для показа), start_sec и end_sec (таймкоды в координатах оригинала), language (ru/tt/unknown — фильтр по языку, индекс), confidence (у татарских может быть пусто), position (порядковый номер слова), speaker_id (кто сказал — фильтр по говорящему, пусто до диаризации).

Таблица speakers

Говорящие, глобально по корпусу. Поля: id, label (мама, папа, ребёнок), created_at. Список говорящих в записи берётся как уникальные speaker_id у её слов.

Таблица word_counts

Частота слова в пределах одной записи (для статистики и топ-слов). Поля: id, audio_id, text, language, count.

Таблица speech_segments

Карта VAD для плеера: соответствие координат оригинала и обрезанного файла. Поля: id, audio_id, orig_start, orig_end, trim_start, trim_end.

Транскрипт на диске

transcription.json содержит audio_id, filename, recorded_at, engine, блок stats с длительностями, segment_map с картой VAD и массив words. Каждое слово: text, raw, start, end, conf, lang, seg_lang, speaker. transcription.txt — те же нормализованные слова через пробел.

API: как доставать данные

Бэкенд FastAPI, роутер backend/src/routers/audio.py. Загрузка аудио — POST /upload-audio/ (запускает пайплайн). Поиск с фильтрами — GET /search/ с необязательными параметрами q (слово), lang (ru/tt), speaker (метка говорящего), date_from и date_to (диапазон по дате записи); все комбинируются, ответ содержит вхождения слова с таймкодом start_sec для перехода в плеере, а также speaker и recorded_at. Список записей — GET /audio/. Оригинал аудио — GET /audio/{id}?type=original. Обрезанное аудио — GET /audio/{id}?type=processed. Список транскриптов — GET /transcriptions/. Полный транскрипт со словами — GET /transcriptions/{id}. Редактирование текста — PATCH /transcriptions/{id}. Удаление — DELETE /audio/{id}.

Обрезанное аудио

Хранится как processed.wav в папке записи, отдельной колонки под путь нет: путь равен folder_path плюс имя файла. Скачивается ручкой type=processed. Этого достаточно, явные колонки путей не нужны.

Нужно ли что-то добавлять в БД

Для фильтров дата, слово, говорящий, язык схема достаточна: recorded_at, words.text, words.language, speakers и words.speaker_id уже есть, дополнительные таблицы не требуются. Говорящий заполняется автоматически шагом диаризации: пайплайн кластеризует голоса и проставляет speaker_id с анонимными метками (Говорящий 1, Говорящий 2…), их можно переименовать в мама/папа через UI/БД (update строки в speakers). Слова, метрики, частоты, сегменты, говорящие пишутся в db_index.save_transcription. Осталось только заполнять recorded_at — прокинуть дату записи при загрузке (поле есть, фильтр по дате готов).
