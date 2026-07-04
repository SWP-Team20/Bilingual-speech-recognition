# -*- coding: utf-8 -*-
import json
import pytest
import numpy as np
from unittest.mock import patch
from uuid import uuid4

from backend.src.pipeline import process_audio

pytestmark = pytest.mark.integration


@pytest.fixture
def mock_pipeline_dependencies():
    with patch("backend.src.audio_process.process_silence") as mock_vad, \
            patch("backend.src.lid.detect") as mock_lid, \
            patch("backend.src.asr.transcribe_array") as mock_asr_ru, \
            patch("backend.src.tatar_asr.transcribe") as mock_asr_tt, \
            patch("backend.src.text_filter.is_meaningful") as mock_filter, \
            patch("backend.src.lang_tag.tag_language_seg") as mock_tag:
        mock_vad.return_value = {
            "audio": np.zeros(16000 * 2, dtype=np.float32),
            "original_wav": "fake_path.wav",
            "segments": [{"start_sample": 0, "end_sample": 16000, "start": 0.0, "end": 1.0}],
            "stats": {"total_duration": 2.0, "speech_duration": 1.0},
        }

        mock_lid.return_value = ("ru", 0.1, 0.9)
        mock_asr_ru.return_value = [{"text": "тест", "start": 0.1, "end": 0.8, "conf": 0.95}]
        mock_asr_tt.return_value = []
        mock_filter.return_value = True
        mock_tag.return_value = ("тест", "ru")

        yield {
            "vad": mock_vad,
            "lid": mock_lid,
            "asr_ru": mock_asr_ru,
        }


def test_process_audio_pipeline_execution(tmp_path, mock_pipeline_dependencies):
    fake_input_file = tmp_path / "input.wav"
    fake_input_file.write_text("dummy audio data")
    storage_dir = tmp_path / "storage"
    audio_id = uuid4()

    result = process_audio(
        input_path=str(fake_input_file),
        storage_dir=str(storage_dir),
        audio_id=audio_id,
        original_filename="test_audio.wav",
        db=None,
    )

    assert result["audio_id"] == str(audio_id)
    assert result["filename"] == "test_audio.wav"
    assert len(result["sentences"]) == 1
    assert result["sentences"][0]["text"] == "тест"

    expected_folder = storage_dir / str(audio_id)
    assert expected_folder.exists()
    assert (expected_folder / "transcription.json").exists()
    assert (expected_folder / "transcription.txt").exists()

    txt_content = (expected_folder / "transcription.txt").read_text(encoding="utf-8")
    assert "тест" in txt_content

    payload = json.loads((expected_folder / "transcription.json").read_text(encoding="utf-8"))
    assert payload["words"][0]["lang"] == "ru"
    assert "sentences" in payload


def test_process_audio_builds_sentences_per_speaker(tmp_path, mock_pipeline_dependencies):
    mock_pipeline_dependencies["asr_ru"].return_value = [
        {"text": "привет.", "start": 0.1, "end": 0.5, "conf": 0.95},
        {"text": "сәлам", "start": 0.6, "end": 0.9, "conf": 0.95},
    ]

    with patch("backend.src.lang_tag.tag_language_seg") as mock_tag:
        mock_tag.side_effect = [("привет", "ru"), ("сәлам", "tt")]

        fake_input_file = tmp_path / "input.wav"
        fake_input_file.write_text("dummy audio data")
        storage_dir = tmp_path / "storage"
        audio_id = uuid4()

        result = process_audio(
            input_path=str(fake_input_file),
            storage_dir=str(storage_dir),
            audio_id=audio_id,
            original_filename="mixed.wav",
            db=None,
        )

    assert len(result["sentences"]) == 2
    assert result["sentences"][0]["lang"] == "ru"
    assert result["sentences"][1]["lang"] == "tt"
