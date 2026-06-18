import librosa
import soundfile as sf
import numpy as np


def remove_silence_librosa(input_path, output_path, top_db=10, min_silence_sec=2.0):
    print("Загрузка файла...")
    y, sr = librosa.load(input_path, sr=None)

    min_silence_samples = int(min_silence_sec * sr)

    frame_len = min_silence_samples
    hop_len = frame_len // 4

    print(f"Поиск пауз длиннее {min_silence_sec} сек...")
    intervals = librosa.effects.split(
        y,
        top_db=top_db,
        frame_length=frame_len,
        hop_length=hop_len
    )

    non_silent_chunks = []
    padding = int(0.15 * sr)

    for start, end in intervals:
        start_pad = max(0, start - padding)
        end_pad = min(len(y), end + padding)
        non_silent_chunks.append(y[start_pad:end_pad])

    if non_silent_chunks:
        combined = np.concatenate(non_silent_chunks)
        sf.write(output_path, combined, sr)
        print(f"Готово! Файл сохранен в: {output_path}")
    else:
        print("Вся запись распознана как тишина. Попробуйте уменьшить top_db (например, до 20).")