import librosa
import soundfile as sf


def quick_trim_silence(file_path, output_path, top_db=30):
    # 1. Load the audio file
    audio_data, sample_rate = librosa.load(file_path, sr=None)

    # 2. Automatically trim leading and trailing silence
    # top_db: The threshold (in decibels) below reference to consider as silence
    trimmed_data, index = librosa.effects.trim(audio_data, top_db=top_db)

    # 3. Save the result
    sf.write(output_path, trimmed_data, sample_rate)
    print(f"Trimmed silence! Original length: {len(audio_data)}, New length: {len(trimmed_data)}")
